'use server';

import {
	getAuthenticatedUser,
	getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import {
	SHARED_REVALIDATE_PATHS,
	revalidateLocalized,
} from '@/app/actions/_helpers';
import { VALID_STATUSES, VALID_MEDIA_TYPES } from '@/lib/validators';
import type { WatchStatus, WatchlistEntry, MediaType } from '@/types/tmdb';
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns';
import {
	getTvShowsTotalEpisodes,
	getListMediaMetadata,
	type ListMediaMetadata,
} from '@/lib/tmdb';

function revalidateWatchlistPaths(mediaType: MediaType, mediaId: number) {
	SHARED_REVALIDATE_PATHS.forEach(revalidateLocalized);
	revalidateLocalized(`/${mediaType}/${mediaId}`);
}

export async function addToWatchlist(
	mediaId: number,
	mediaTitle: string,
	posterPath: string | null,
	status: WatchStatus,
	mediaType: MediaType
): Promise<void> {
	if (!VALID_STATUSES.has(status)) throw new Error('Invalid status');
	if (!VALID_MEDIA_TYPES.has(mediaType))
		throw new Error('Invalid media_type');

	const { supabase, userId } = await getAuthenticatedUser();

	const { release_date, genre_ids, total_episodes } =
		await getListMediaMetadata(mediaId, mediaType);

	const { error } = await supabase.from('watchlist').upsert(
		{
			user_id: userId,
			media_id: mediaId,
			media_title: mediaTitle,
			poster_path: posterPath,
			status,
			media_type: mediaType,
			total_episodes,
			release_date,
			genre_ids,
		},
		{ onConflict: 'user_id,media_id,media_type' }
	);

	if (error) throw new Error(error.message);

	revalidateWatchlistPaths(mediaType, mediaId);
}

/** One-shot backfill: fills total_episodes for the caller's TV watchlist rows that lack it (library cold-load → instant). */
export async function backfillTvTotals(): Promise<{ updated: number }> {
	const { supabase, userId } = await getAuthenticatedUser();

	const { data: rows } = await supabase
		.from('watchlist')
		.select('media_id')
		.eq('user_id', userId)
		.eq('media_type', 'tv')
		.is('total_episodes', null);

	const ids = (rows ?? []).map((r) => r.media_id);
	if (ids.length === 0) return { updated: 0 };

	const totals = await getTvShowsTotalEpisodes(ids);
	let updated = 0;
	await Promise.all(
		ids.map(async (id) => {
			const total = totals[id];
			if (!total) return;
			await supabase
				.from('watchlist')
				.update({ total_episodes: total })
				.eq('user_id', userId)
				.eq('media_id', id)
				.eq('media_type', 'tv');
			updated++;
		})
	);
	return { updated };
}

const META_BATCH_SIZE = 8;

/**
 * One-shot backfill: fills release_date + genre_ids for the caller's watchlist and
 * playlist rows that predate the sort/filter migration, so lists can sort by year and
 * filter by genre. Targets rows where genre_ids is null (new rows are populated on insert).
 */
export async function backfillListMetadata(): Promise<{
	watchlist: number;
	playlistItems: number;
}> {
	const { supabase, userId } = await getAuthenticatedUser();

	const [watchlistResult, playlistsResult] = await Promise.all([
		supabase
			.from('watchlist')
			.select('media_id, media_type')
			.eq('user_id', userId)
			.is('genre_ids', null),
		supabase.from('playlists').select('id').eq('user_id', userId),
	]);

	const watchlistRows = watchlistResult.data ?? [];
	const playlistIds = (playlistsResult.data ?? []).map((p) => p.id);

	const playlistItemsResult = playlistIds.length
		? await supabase
				.from('playlist_items')
				.select('media_id, media_type')
				.in('playlist_id', playlistIds)
				.is('genre_ids', null)
		: null;
	const playlistRows = playlistItemsResult?.data ?? [];

	const uniqueItems = new Map<string, { id: number; type: MediaType }>();
	for (const row of [...watchlistRows, ...playlistRows]) {
		const type = row.media_type as MediaType;
		uniqueItems.set(`${type}-${row.media_id}`, {
			id: row.media_id,
			type,
		});
	}
	if (uniqueItems.size === 0) return { watchlist: 0, playlistItems: 0 };

	const items = Array.from(uniqueItems.values());
	const metaByKey = new Map<string, ListMediaMetadata>();
	for (let i = 0; i < items.length; i += META_BATCH_SIZE) {
		const batch = items.slice(i, i + META_BATCH_SIZE);
		const results = await Promise.all(
			batch.map(
				async (item) =>
					[
						`${item.type}-${item.id}`,
						await getListMediaMetadata(item.id, item.type),
					] as const
			)
		);
		for (const [key, meta] of results) metaByKey.set(key, meta);
	}

	let watchlistUpdated = 0;
	await Promise.all(
		watchlistRows.map(async (row) => {
			const meta = metaByKey.get(`${row.media_type}-${row.media_id}`);
			if (!meta) return;
			await supabase
				.from('watchlist')
				.update({
					release_date: meta.release_date,
					genre_ids: meta.genre_ids,
				})
				.eq('user_id', userId)
				.eq('media_id', row.media_id)
				.eq('media_type', row.media_type);
			watchlistUpdated++;
		})
	);

	let playlistUpdated = 0;
	if (playlistIds.length) {
		const playlistKeys = new Set(
			playlistRows.map((row) => `${row.media_type}-${row.media_id}`)
		);
		await Promise.all(
			Array.from(playlistKeys).map(async (key) => {
				const meta = metaByKey.get(key);
				const item = uniqueItems.get(key);
				if (!meta || !item) return;
				await supabase
					.from('playlist_items')
					.update({
						release_date: meta.release_date,
						genre_ids: meta.genre_ids,
					})
					.in('playlist_id', playlistIds)
					.eq('media_id', item.id)
					.eq('media_type', item.type);
				playlistUpdated++;
			})
		);
	}

	return { watchlist: watchlistUpdated, playlistItems: playlistUpdated };
}

export async function removeFromWatchlist(
	mediaId: number,
	mediaType: MediaType
): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('watchlist')
		.delete()
		.eq('user_id', userId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType);

	if (error) throw new Error(error.message);

	if (mediaType === 'tv') {
		await supabase
			.from('episode_watches')
			.delete()
			.eq('user_id', userId)
			.eq('tv_id', mediaId);
	}

	revalidateWatchlistPaths(mediaType, mediaId);
}

export async function getUserWatchlist(): Promise<WatchlistEntry[]> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId) return [];

	const { data: entries, error } = await supabase
		.from('watchlist')
		.select(WATCHLIST_COLUMNS)
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(1000);

	if (error) throw new Error(error.message);

	return (entries as WatchlistEntry[]) ?? [];
}

export async function getMediaWatchlistEntry(
	mediaId: number,
	mediaType: MediaType
): Promise<WatchlistEntry | null> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId) return null;

	const { data: entry } = await supabase
		.from('watchlist')
		.select(WATCHLIST_COLUMNS)
		.eq('user_id', userId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType)
		.maybeSingle();

	return (entry as WatchlistEntry) ?? null;
}

export async function getMediaWatchlistEntries(
	mediaIds: number[]
): Promise<WatchlistEntry[]> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId || mediaIds.length === 0) return [];

	const { data: entries, error } = await supabase
		.from('watchlist')
		.select(WATCHLIST_COLUMNS)
		.eq('user_id', userId)
		.in('media_id', mediaIds);

	if (error) throw new Error(error.message);

	return (entries as WatchlistEntry[]) ?? [];
}
