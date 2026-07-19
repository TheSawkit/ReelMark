import { cache } from 'react';
import { getUserWatchlist } from '@/app/actions/watchlist';
import { getAllTvShowsWatchProgress } from '@/app/actions/episodes';
import { getMyReviewRatings } from '@/app/actions/reviews';
import {
	getMyDismissals,
	getMyStreamingProviders,
} from '@/app/actions/recommendations';
import type { MediaItem, WatchlistEntry } from '@/types/tmdb';

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
