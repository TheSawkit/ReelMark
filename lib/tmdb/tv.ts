import type {
	TvShow,
	TvShowDetails,
	SeasonDetails,
	Credits,
	Video,
	ContentRatingsResponse,
	MediaImagesResponse,
	WatchProvidersRegion,
} from '@/types/tmdb';
import { fetchTMDB, getUserRegion, REVALIDATE } from './client';
import {
	fetchMediaCredits,
	fetchMediaDetails,
	fetchMediaImages,
	fetchMediaPage,
	fetchMediaVideos,
	fetchRelatedMedia,
	fetchWatchProviders,
} from './media-endpoints';
import { reportSwallowed } from '@/lib/report';
import type { Language } from '@/lib/i18n/translations';
import { findTvCertification } from './certifications';

/** @returns Paginated list of popular TV shows. */
export async function getPopularTvShows(
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	return fetchMediaPage<TvShow>('/tv/popular', page, lang);
}

/** @returns Paginated list of top-rated TV shows. */
export async function getTopRatedTvShows(
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	return fetchMediaPage<TvShow>('/tv/top_rated', page, lang);
}

/**
 * @param timeWindow - Trending window: "day" or "week" (default: "week").
 * @returns Paginated list of trending TV shows.
 */
export async function getTrendingTvShows(
	timeWindow: 'day' | 'week' = 'week',
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	return fetchMediaPage<TvShow>(`/trending/tv/${timeWindow}`, page, lang);
}

/** @returns Paginated list of TV shows airing today. */
export async function getAiringTodayTvShows(
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	return fetchMediaPage<TvShow>('/tv/airing_today', page, lang);
}

/** @returns Paginated list of TV shows currently on the air. */
export async function getOnTheAirTvShows(
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	return fetchMediaPage<TvShow>('/tv/on_the_air', page, lang);
}

/**
 * Full TV show details. Viewer-independent and cached, so a detail page can prerender its
 * shell — the age certification lives in `getTvShowCertification`.
 *
 * @param id - TMDB TV show ID.
 */
export async function getTvShowDetails(
	id: number,
	lang?: Language
): Promise<TvShowDetails> {
	return fetchMediaDetails<TvShowDetails>('tv', id, lang);
}

/**
 * Age certification for the viewer's own region, resolved separately from the details fetch.
 * It reads the session, so awaiting it outside a Suspense boundary would stop the detail
 * page from prerendering a static shell.
 */
export async function getTvShowCertification(
	id: number,
	lang?: Language
): Promise<string | undefined> {
	try {
		const [ratings, userRegion] = await Promise.all([
			fetchTMDB<ContentRatingsResponse>(
				`/tv/${id}/content_ratings`,
				{},
				{ revalidate: REVALIDATE.day, lang }
			),
			getUserRegion(lang),
		]);
		return findTvCertification(ratings, userRegion);
	} catch (error) {
		reportSwallowed('tmdb/tv:certification', error);
		return undefined;
	}
}

async function getTvShowTotalEpisodes(
	id: number,
	lang?: Language
): Promise<number> {
	try {
		const details = await getTvShowDetails(id, lang);
		return (details.seasons ?? [])
			.filter((s) => s.season_number > 0)
			.reduce((sum, s) => sum + s.episode_count, 0);
	} catch (error) {
		reportSwallowed('tmdb/tv:total-episodes', error);
		return 0;
	}
}

const TV_EPISODES_BATCH_SIZE = 8;

/** Batched total-episode lookup that caps TMDB concurrency to avoid 429 rate limiting on the library. */
export async function getTvShowsTotalEpisodes(
	ids: number[],
	lang?: Language
): Promise<Record<number, number>> {
	const totals: Record<number, number> = {};
	for (let i = 0; i < ids.length; i += TV_EPISODES_BATCH_SIZE) {
		const batch = ids.slice(i, i + TV_EPISODES_BATCH_SIZE);
		const counts = await Promise.all(
			batch.map(
				async (id) =>
					[id, await getTvShowTotalEpisodes(id, lang)] as const
			)
		);
		for (const [id, total] of counts) totals[id] = total;
	}
	return totals;
}

/** @returns Cast and crew credits for the given TV show. */
export async function getTvShowCredits(
	id: number,
	lang?: Language
): Promise<Credits> {
	return fetchMediaCredits('tv', id, lang);
}

/** @returns Official video trailers and clips for the given TV show. */
export async function getTvShowVideos(
	id: number,
	lang?: Language
): Promise<Video[]> {
	return fetchMediaVideos('tv', id, lang);
}

/** @returns Available backdrop and poster images for the given TV show. */
export async function getTvShowImages(
	id: number,
	lang?: Language
): Promise<MediaImagesResponse> {
	return fetchMediaImages('tv', id, lang);
}

/**
 * Returns recommended TV shows based on a given show.
 * Returns an empty array on failure.
 */
export async function getTvShowRecommendations(
	id: number,
	lang?: Language,
	page = 1
): Promise<TvShow[]> {
	return fetchRelatedMedia<TvShow>('tv', 'recommendations', id, lang, page);
}

/**
 * Returns TV shows similar to the given show.
 * Returns an empty array on failure.
 */
export async function getSimilarTvShows(
	id: number,
	lang?: Language,
	page = 1
): Promise<TvShow[]> {
	return fetchRelatedMedia<TvShow>('tv', 'similar', id, lang, page);
}

/**
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @returns Full season details including episodes.
 */
export async function getSeasonDetails(
	tvId: number,
	seasonNumber: number,
	lang?: Language
): Promise<SeasonDetails> {
	return fetchTMDB<SeasonDetails>(
		`/tv/${tvId}/season/${seasonNumber}`,
		{},
		{ revalidate: REVALIDATE.day, lang }
	);
}

/**
 * Returns watch providers for a TV show filtered to the user's region.
 * Returns null if no providers are available for that region.
 * Data sourced from JustWatch via TMDB.
 *
 * @param id - TMDB TV show ID.
 * @returns Watch providers for the user's region, or null.
 */
export async function getTvShowWatchProviders(
	id: number,
	lang?: Language
): Promise<WatchProvidersRegion | null> {
	return fetchWatchProviders('tv', id, lang);
}
