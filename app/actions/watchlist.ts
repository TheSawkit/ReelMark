'use server';

import {
	getAuthenticatedUser,
	getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import {
	SHARED_REVALIDATE_PATHS,
	revalidateLocalizedAfterResponse,
} from '@/app/actions/_helpers';
import { VALID_STATUSES, VALID_MEDIA_TYPES } from '@/lib/validators';
import type { WatchStatus, WatchlistEntry, MediaType } from '@/types/tmdb';
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns';
import type { Database } from '@/types/database';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { getListMediaMetadata, type ListMediaMetadata } from '@/lib/tmdb';

function revalidateWatchlistPaths(mediaType: MediaType, mediaId: number) {
	revalidateLocalizedAfterResponse([
		...SHARED_REVALIDATE_PATHS,
		`/${mediaType}/${mediaId}`,
	]);
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

/**
 * Updates the status of an existing watchlist entry, letting a show be abandoned or
 * picked back up without refetching its TMDB metadata.
 *
 * @param mediaId - TMDB media ID.
 * @param mediaType - "movie" or "tv".
 * @param status - Target watchlist status.
 * @returns The applied status, so callers can tell success from failure.
 */
export async function setWatchlistStatus(
	mediaId: number,
	mediaType: MediaType,
	status: WatchStatus
): Promise<WatchStatus> {
	if (!VALID_STATUSES.has(status)) throw new Error('Invalid status');
	if (!VALID_MEDIA_TYPES.has(mediaType))
		throw new Error('Invalid media_type');

	const { supabase, userId } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('watchlist')
		.update({ status })
		.eq('user_id', userId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType);

	if (error) throw new Error(error.message);

	revalidateWatchlistPaths(mediaType, mediaId);
	return status;
}

const META_BATCH_SIZE = 8;

/**
 * Colonnes à écrire pour une ligne de liste, ou null s'il n'y a rien de fiable à écrire.
 * Une réponse TMDB vide (panne transitoire) ne doit jamais écraser des genres déjà corrects.
 */
function buildMetadataPatch(
	meta: ListMediaMetadata,
	mediaType: MediaType
): Database['public']['Tables']['watchlist']['Update'] | null {
	const patch: Database['public']['Tables']['watchlist']['Update'] = {};

	if (meta.genre_ids.length > 0) {
		patch.release_date = meta.release_date;
		patch.genre_ids = meta.genre_ids;
	}
	if (mediaType === 'tv' && meta.total_episodes !== null) {
		patch.total_episodes = meta.total_episodes;
	}

	return Object.keys(patch).length > 0 ? patch : null;
}

const BACKFILL_RUN_LIMIT = 200;

/**
 * Incremental backfill: fills release_date + genre_ids for the caller's watchlist and
 * playlist rows that predate the sort/filter migration, so lists can sort by year and
 * filter by genre. Bounded per run to avoid TMDB bursts on large libraries — it
 * converges across visits. Targets rows where genre_ids is null.
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
			// Les séries dont le total d'épisodes manque comptent aussi : sans elles, une
			// ligne aux genres déjà remplis restait exclue à vie et /library refetchait son
			// total à chaque rendu.
			.or(
				'genre_ids.is.null,and(media_type.eq.tv,total_episodes.is.null)'
			)
			.limit(BACKFILL_RUN_LIMIT),
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
				.limit(BACKFILL_RUN_LIMIT)
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

			const patch = buildMetadataPatch(meta, row.media_type as MediaType);
			if (!patch) return;

			await supabase
				.from('watchlist')
				.update(patch)
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

				// playlist_items n'a pas de colonne total_episodes : on ne garde que le
				// volet genres, et seulement s'il est fiable.
				if (meta.genre_ids.length === 0) return;

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

	const entries = await fetchAllRows((from, to) =>
		supabase
			.from('watchlist')
			.select(WATCHLIST_COLUMNS)
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.order('id')
			.range(from, to)
	);

	return entries as WatchlistEntry[];
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
