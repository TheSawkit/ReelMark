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
	getMovieCredits,
	getTvShowCredits,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import type { MediaItem, MediaType, WatchlistEntry } from '@/types/tmdb';
import { getMediaKey } from '@/lib/media';
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

const CATEGORY_FETCHERS: Map<string, CategoryFetcher> = new Map([
	['popular', (page) => getPopularMovies(page).then((r) => r.map(movieToMediaItem))],
	['top-rated', (page) => getTopRatedMovies(page).then((r) => r.map(movieToMediaItem))],
	['upcoming', (page) => getUpcomingMovies(page).then((r) => r.map(movieToMediaItem))],
	['now-playing', (page) => getNowPlayingMovies(page).then((r) => r.map(movieToMediaItem))],
	['trending', (page) => getTrendingMovies('week', page).then((r) => r.map(movieToMediaItem))],
	['tv-popular', (page) => getPopularTvShows(page).then((r) => r.map(tvShowToMediaItem))],
	['tv-top-rated', (page) => getTopRatedTvShows(page).then((r) => r.map(tvShowToMediaItem))],
	['tv-trending', (page) => getTrendingTvShows('week', page).then((r) => r.map(tvShowToMediaItem))],
	['tv-airing-today', (page) => getAiringTodayTvShows(page).then((r) => r.map(tvShowToMediaItem))],
	['tv-on-the-air', (page) => getOnTheAirTvShows(page).then((r) => r.map(tvShowToMediaItem))],
]);

/**
 * Fetches a paginated list of media items for a given category and merges watchlist data.
 *
 * @param category - Category slug (e.g. "popular", "tv-trending").
 * @param page - Page number for pagination.
 * @returns Enriched media items for the requested category and page.
 */
export async function fetchMoreMedia(category: string, page: number): Promise<MediaItem[]> {
    if (!CATEGORY_FETCHERS.has(category)) return [];
    const fetcher = CATEGORY_FETCHERS.get(category)!;
    const items = await fetcher(page);
    return mergeMediaWithWatchlist(items);
}

const ACTOR_FILTER_MAX_ITEMS = 300;
const ACTOR_CREDITS_BATCH_SIZE = 8;

function normalizeName(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.trim();
}

/**
 * Returns the media keys of the given list items whose cast includes an actor matching
 * the query. Credits are fetched on demand (cached) only for the current list, so the
 * heavy cast data is never loaded unless an actor filter is active. Diacritic- and
 * case-insensitive. Very long lists are capped to bound the number of TMDB calls.
 *
 * @param items - The list items currently displayed.
 * @param query - Actor name fragment to match.
 * @returns Matching media keys (`"movie-123"`).
 */
export async function filterListByActor(
	items: Array<{ id: number; media_type: MediaType }>,
	query: string
): Promise<string[]> {
	const needle = normalizeName(query);
	if (needle === '') return items.map((item) => getMediaKey(item));

	const scoped = items.slice(0, ACTOR_FILTER_MAX_ITEMS);
	if (scoped.length < items.length) {
		console.warn(
			`[filterListByActor] Capped actor matching to ${ACTOR_FILTER_MAX_ITEMS}/${items.length} items.`
		);
	}

	const matches: string[] = [];
	for (let i = 0; i < scoped.length; i += ACTOR_CREDITS_BATCH_SIZE) {
		const batch = scoped.slice(i, i + ACTOR_CREDITS_BATCH_SIZE);
		const results = await Promise.all(
			batch.map(async (item) => {
				try {
					const credits =
						item.media_type === 'tv'
							? await getTvShowCredits(item.id)
							: await getMovieCredits(item.id);
					const hit = credits.cast.some((member) =>
						normalizeName(member.name).includes(needle)
					);
					return hit ? getMediaKey(item) : null;
				} catch {
					return null;
				}
			})
		);
		for (const key of results) if (key) matches.push(key);
	}

	return matches;
}
