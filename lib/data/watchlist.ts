import 'server-only';

import { cache } from 'react';
import { getOptionalUser } from '@/lib/supabase/auth-helpers';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns';
import { getAllTvShowsWatchProgress } from '@/lib/data/episodes';
import { getMyReviewRatings } from '@/lib/data/reviews';
import {
	getMyDismissals,
	getMyStreamingProviders,
} from '@/lib/data/recommendations';
import type { MediaItem, MediaType, WatchlistEntry } from '@/types/tmdb';

/** Every watchlist row of the authenticated user, newest first; empty when signed out. */
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

/** The authenticated user's watchlist row for one title, or null when absent. */
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

/** Watchlist rows for a batch of TMDB IDs, so a grid can badge its cards in one query. */
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

export const getCachedUserWatchlist = cache(getUserWatchlist);
export const getCachedMyRatings = cache(getMyReviewRatings);
export const getCachedDismissals = cache(getMyDismissals);
export const getCachedStreamingProviders = cache(getMyStreamingProviders);

/**
 * Loads the user's watchlist and per-show episode progress in one request-deduped call.
 * Argument-free so React.cache shares a single execution across all streamed sections.
 */
export const getWatchlistWithProgress = cache(
	async (): Promise<{
		watchlist: WatchlistEntry[];
		tvProgress: Record<number, number>;
	}> => {
		const watchlist = await getCachedUserWatchlist();
		const tvIds = watchlist
			.filter((e) => e.media_type === 'tv')
			.map((e) => e.media_id);
		const tvProgress = await getAllTvShowsWatchProgress(tvIds);
		return { watchlist, tvProgress };
	}
);

/**
 * Enriches media items with their watchlist entry using the request-cached full watchlist,
 * so concurrent streamed sections share a single Supabase read instead of one query each.
 */
export async function mergeWithWatchlist(
	items: MediaItem[]
): Promise<MediaItem[]> {
	if (items.length === 0) return [];
	const watchlist = await getCachedUserWatchlist();
	return items.map((item) => ({
		...item,
		watchlistEntry: watchlist.find(
			(entry) =>
				entry.media_id === item.id &&
				entry.media_type === item.media_type
		),
	}));
}
