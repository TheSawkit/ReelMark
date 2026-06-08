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
	getTvShowTotalEpisodes,
	getTvShowsTotalEpisodes,
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

	const totalEpisodes =
		mediaType === 'tv' ? await getTvShowTotalEpisodes(mediaId) : null;

	const { error } = await supabase.from('watchlist').upsert(
		{
			user_id: userId,
			media_id: mediaId,
			media_title: mediaTitle,
			poster_path: posterPath,
			status,
			media_type: mediaType,
			total_episodes: totalEpisodes,
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
