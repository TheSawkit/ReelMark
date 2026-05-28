'use server';

import {
    getPopularMovies,
    getTopRatedMovies,
    getUpcomingMovies,
    getNowPlayingMovies,
    getTrendingMovies,
    getPopularTvShows,
    getTopRatedTvShows,
    getTrendingTvShows,
    getAiringTodayTvShows,
    getOnTheAirTvShows,
    movieToMediaItem,
    tvShowToMediaItem,
} from '@/lib/tmdb';
import type { MediaItem, WatchlistEntry } from '@/types/tmdb';
import { getMediaWatchlistEntries } from './watchlist';

/**
 * Enriches a list of media items with their corresponding watchlist entries for the current user.
 * Items without a watchlist entry are returned unchanged.
 *
 * @param items - Media items to enrich.
 * @returns The same items with `watchlistEntry` injected where a match exists.
 */
export async function mergeMediaWithWatchlist(
    items: MediaItem[]
): Promise<MediaItem[]> {
    if (items.length === 0) return [];

    const mediaIds = items.map((item) => item.id);
    const watchlistEntries = await getMediaWatchlistEntries(mediaIds);

    return items.map((item) => ({
        ...item,
        watchlistEntry: watchlistEntries.find(
            (entry: WatchlistEntry) =>
                entry.media_id === item.id &&
                entry.media_type === item.media_type
        ),
    }));
}

type CategoryFetcher = (page: number) => Promise<MediaItem[]>;

const CATEGORY_FETCHERS: Record<string, CategoryFetcher> = {
    popular: (page) =>
        getPopularMovies(page).then((r) => r.map(movieToMediaItem)),
    'top-rated': (page) =>
        getTopRatedMovies(page).then((r) => r.map(movieToMediaItem)),
    upcoming: (page) =>
        getUpcomingMovies(page).then((r) => r.map(movieToMediaItem)),
    'now-playing': (page) =>
        getNowPlayingMovies(page).then((r) => r.map(movieToMediaItem)),
    trending: (page) =>
        getTrendingMovies('week', page).then((r) => r.map(movieToMediaItem)),
    'tv-popular': (page) =>
        getPopularTvShows(page).then((r) => r.map(tvShowToMediaItem)),
    'tv-top-rated': (page) =>
        getTopRatedTvShows(page).then((r) => r.map(tvShowToMediaItem)),
    'tv-trending': (page) =>
        getTrendingTvShows('week', page).then((r) => r.map(tvShowToMediaItem)),
    'tv-airing-today': (page) =>
        getAiringTodayTvShows(page).then((r) => r.map(tvShowToMediaItem)),
    'tv-on-the-air': (page) =>
        getOnTheAirTvShows(page).then((r) => r.map(tvShowToMediaItem)),
};

/**
 * Fetches a paginated list of media items for a given category and merges watchlist data.
 *
 * @param category - Category slug (e.g. "popular", "tv-trending").
 * @param page - Page number for pagination.
 * @returns Enriched media items for the requested category and page.
 */
export async function fetchMoreMedia(
    category: string,
    page: number
): Promise<MediaItem[]> {
    const fetcher = CATEGORY_FETCHERS[category];
    const items = fetcher ? await fetcher(page) : [];
    return mergeMediaWithWatchlist(items);
}
