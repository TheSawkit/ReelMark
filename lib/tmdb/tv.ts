import type {
	TvShow,
	TvShowDetails,
	SeasonDetails,
	Credits,
	Video,
	VideoResponse,
	ContentRatingsResponse,
	MediaImagesResponse,
	WatchProvidersRegion,
	WatchProvidersResponse,
} from '@/types/tmdb';
import {
	fetchTMDB,
	getUserRegion,
	clampPage,
	getImageLanguageFilter,
} from './client';
import { getWatchmodeProviders } from '@/lib/watchmode/providers';
import { reportSwallowed } from '@/lib/report';
import type { Language } from '@/lib/i18n/translations';
import { findTvCertification } from './certifications';

/** @returns Paginated list of popular TV shows. */
export async function getPopularTvShows(
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	const { results } = await fetchTMDB<{ results: TvShow[] }>(
		'/tv/popular',
		{ page: clampPage(page).toString() },
		{ lang }
	);
	return results;
}

/** @returns Paginated list of top-rated TV shows. */
export async function getTopRatedTvShows(
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	const { results } = await fetchTMDB<{ results: TvShow[] }>(
		'/tv/top_rated',
		{ page: clampPage(page).toString() },
		{ lang }
	);
	return results;
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
	const { results } = await fetchTMDB<{ results: TvShow[] }>(
		`/trending/tv/${timeWindow}`,
		{ page: clampPage(page).toString() },
		{ lang }
	);
	return results;
}

/** @returns Paginated list of TV shows airing today. */
export async function getAiringTodayTvShows(
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	const { results } = await fetchTMDB<{ results: TvShow[] }>(
		'/tv/airing_today',
		{ page: clampPage(page).toString() },
		{ lang }
	);
	return results;
}

/** @returns Paginated list of TV shows currently on the air. */
export async function getOnTheAirTvShows(
	page: number = 1,
	lang?: Language
): Promise<TvShow[]> {
	const { results } = await fetchTMDB<{ results: TvShow[] }>(
		'/tv/on_the_air',
		{ page: clampPage(page).toString() },
		{ lang }
	);
	return results;
}

/**
 * Fetches full TV show details including certification for the user's region.
 *
 * @param id - TMDB TV show ID.
 * @returns Full TV show details with optional certification field.
 */
export async function getTvShowDetails(
	id: number,
	lang?: Language
): Promise<TvShowDetails> {
	const details = await fetchTMDB<TvShowDetails>(
		`/tv/${id}`,
		{},
		{ revalidate: 86400, lang }
	);

	try {
		const ratings = await fetchTMDB<ContentRatingsResponse>(
			`/tv/${id}/content_ratings`,
			{},
			{ revalidate: 86400, lang }
		);
		const userRegion = await getUserRegion(lang);
		details.certification = findTvCertification(ratings, userRegion);
	} catch (error) {
		reportSwallowed('tmdb/tv:certification', error);
		details.certification = undefined;
	}

	return details;
}

/**
 * Returns the total episode count across all seasons of a TV show.
 * Returns 0 on failure.
 *
 * @param id - TMDB TV show ID.
 * @returns Total number of episodes.
 */
async function getTvShowTotalEpisodes(
	id: number,
	lang?: Language
): Promise<number> {
	try {
		const details = await fetchTMDB<TvShowDetails>(
			`/tv/${id}`,
			{},
			{ revalidate: 86400, lang }
		);
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
	return fetchTMDB<Credits>(
		`/tv/${id}/credits`,
		{},
		{ revalidate: 86400, lang }
	);
}

/** @returns Official video trailers and clips for the given TV show. */
export async function getTvShowVideos(
	id: number,
	lang?: Language
): Promise<Video[]> {
	const { results } = await fetchTMDB<VideoResponse>(
		`/tv/${id}/videos`,
		{},
		{ revalidate: 86400, lang }
	);
	return results;
}

/** @returns Available backdrop and poster images for the given TV show. */
export async function getTvShowImages(
	id: number,
	lang?: Language
): Promise<MediaImagesResponse> {
	const imageLanguage = await getImageLanguageFilter(lang);
	return fetchTMDB<MediaImagesResponse>(
		`/tv/${id}/images`,
		{
			include_image_language: imageLanguage,
		},
		{ revalidate: 86400, lang }
	);
}

/**
 * Returns recommended TV shows based on a given show.
 * Returns an empty array on failure.
 */
export async function getTvShowRecommendations(
	id: number,
	lang?: Language
): Promise<TvShow[]> {
	try {
		const { results } = await fetchTMDB<{ results: TvShow[] }>(
			`/tv/${id}/recommendations`,
			{},
			{ revalidate: 86400, lang }
		);
		return results;
	} catch (error) {
		reportSwallowed('tmdb/tv:recommendations', error);
		return [];
	}
}

/**
 * Returns TV shows similar to the given show.
 * Returns an empty array on failure.
 */
export async function getSimilarTvShows(
	id: number,
	lang?: Language
): Promise<TvShow[]> {
	try {
		const { results } = await fetchTMDB<{ results: TvShow[] }>(
			`/tv/${id}/similar`,
			{},
			{ revalidate: 86400, lang }
		);
		return results;
	} catch (error) {
		reportSwallowed('tmdb/tv:similar', error);
		return [];
	}
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
		{ revalidate: 86400, lang }
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
	try {
		const region = await getUserRegion(lang);
		const [tmdbData, watchmode] = await Promise.all([
			fetchTMDB<WatchProvidersResponse>(
				`/tv/${id}/watch/providers`,
				{},
				{ revalidate: 43200, lang }
			),
			getWatchmodeProviders(id, 'tv', region),
		]);
		const tmdb = tmdbData.results[region] ?? null;

		if (watchmode) {
			return {
				link: tmdb?.link ?? '',
				flatrate: watchmode.streaming.length
					? watchmode.streaming
					: tmdb?.flatrate,
				rent: watchmode.rent.length ? watchmode.rent : tmdb?.rent,
				buy: watchmode.buy.length ? watchmode.buy : tmdb?.buy,
			};
		}

		return tmdb;
	} catch (error) {
		reportSwallowed('tmdb/tv:watch-providers', error);
		return null;
	}
}
