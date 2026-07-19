import type {
	Movie,
	MovieDetails,
	CollectionDetails,
	Credits,
	Video,
	VideoResponse,
	ReleaseDatesResponse,
	MediaImagesResponse,
	WatchProvidersRegion,
	WatchProvidersResponse,
} from '@/types/tmdb';
import {
	fetchTMDB,
	getUserRegion,
	clampPage,
	getMergeRegions,
	getImageLanguageFilter,
} from './client';
import { getWatchmodeProviders } from '@/lib/watchmode/providers';
import type { Language } from '@/lib/i18n/translations';
import { findLocalCertification } from './certifications';

/** @returns Paginated list of popular movies. */
export async function getPopularMovies(
	page: number = 1,
	lang?: Language
): Promise<Movie[]> {
	const { results } = await fetchTMDB<{ results: Movie[] }>(
		'/movie/popular',
		{
			page: clampPage(page).toString(),
		},
		{ lang }
	);
	return results;
}

/** @returns Paginated list of top-rated movies. */
export async function getTopRatedMovies(
	page: number = 1,
	lang?: Language
): Promise<Movie[]> {
	const { results } = await fetchTMDB<{ results: Movie[] }>(
		'/movie/top_rated',
		{ page: clampPage(page).toString() },
		{ lang }
	);
	return results;
}

/**
 * @param timeWindow - Trending window: "day" or "week" (default: "week").
 * @returns Paginated list of trending movies.
 */
export async function getTrendingMovies(
	timeWindow: 'day' | 'week' = 'week',
	page: number = 1,
	lang?: Language
): Promise<Movie[]> {
	const { results } = await fetchTMDB<{ results: Movie[] }>(
		`/trending/movie/${timeWindow}`,
		{ page: clampPage(page).toString() },
		{ lang }
	);
	return results;
}

/**
 * Returns movies with upcoming release dates, filtered by the user's region.
 * @returns Paginated list of upcoming movies.
 */
export async function getUpcomingMovies(
	page: number = 1,
	lang?: Language
): Promise<Movie[]> {
	const region = await getUserRegion(lang);
	const today = new Date().toISOString().split('T')[0];

	const { results } = await fetchTMDB<{ results: Movie[] }>(
		'/discover/movie',
		{
			page: clampPage(page).toString(),
			region,
			'release_date.gte': today,
			sort_by: 'popularity.desc',
			with_release_type: '2|3',
		},
		{ lang }
	);

	return results;
}

/**
 * Returns movies currently in theaters, filtered by the user's region.
 * For Belgium, merges BE and FR results to maximize coverage.
 * @returns Paginated list of now-playing movies.
 */
export async function getNowPlayingMovies(
	page: number = 1,
	lang?: Language
): Promise<Movie[]> {
	const region = await getUserRegion(lang);
	const mergeRegions = getMergeRegions(region);

	if (mergeRegions) {
		const responses = await Promise.all(
			mergeRegions.map((r) =>
				fetchTMDB<{ results: Movie[] }>(
					'/movie/now_playing',
					{
						page: clampPage(page).toString(),
						region: r,
					},
					{ lang }
				)
			)
		);

		const movieMap = new Map<number, Movie>();
		for (const response of responses) {
			for (const movie of response.results) {
				movieMap.set(movie.id, movie);
			}
		}

		return Array.from(movieMap.values()).sort(
			(a, b) => b.popularity - a.popularity
		);
	}

	const { results } = await fetchTMDB<{ results: Movie[] }>(
		'/movie/now_playing',
		{
			page: clampPage(page).toString(),
			region,
		},
		{ lang }
	);

	return results;
}

/**
 * Fetches full movie details including certification for the user's region.
 * Certification is fetched separately and injected into the returned object.
 *
 * @param id - TMDB movie ID.
 * @returns Full movie details with optional certification field.
 */
export async function getMovieDetails(
	id: number,
	lang?: Language
): Promise<MovieDetails> {
	const details = await fetchTMDB<MovieDetails>(
		`/movie/${id}`,
		{},
		{ revalidate: 86400, lang }
	);

	try {
		const releaseDates = await fetchTMDB<ReleaseDatesResponse>(
			`/movie/${id}/release_dates`,
			{},
			{ revalidate: 86400, lang }
		);
		const userRegion = await getUserRegion(lang);
		details.certification = findLocalCertification(
			releaseDates,
			userRegion
		);
	} catch (error) {
		console.warn(
			`[tmdb/movies] Certification fetch failed for movie ${id}:`,
			error
		);
		details.certification = undefined;
	}

	return details;
}

/** @returns Cast and crew credits for the given movie. */
export async function getMovieCredits(
	id: number,
	lang?: Language
): Promise<Credits> {
	return fetchTMDB<Credits>(
		`/movie/${id}/credits`,
		{},
		{ revalidate: 86400, lang }
	);
}

/** @returns Official video trailers and clips for the given movie. */
export async function getMovieVideos(
	id: number,
	lang?: Language
): Promise<Video[]> {
	const { results } = await fetchTMDB<VideoResponse>(
		`/movie/${id}/videos`,
		{},
		{ revalidate: 86400, lang }
	);
	return results;
}

/**
 * Returns recommended movies based on a given movie.
 * Returns an empty array on failure.
 */
export async function getMovieRecommendations(
	id: number,
	lang?: Language
): Promise<Movie[]> {
	try {
		const { results } = await fetchTMDB<{ results: Movie[] }>(
			`/movie/${id}/recommendations`,
			{},
			{ revalidate: 86400, lang }
		);
		return results;
	} catch {
		return [];
	}
}

/**
 * Returns movies similar to the given movie.
 * Returns an empty array on failure.
 */
export async function getSimilarMovies(
	id: number,
	lang?: Language
): Promise<Movie[]> {
	try {
		const { results } = await fetchTMDB<{ results: Movie[] }>(
			`/movie/${id}/similar`,
			{},
			{ revalidate: 86400, lang }
		);
		return results;
	} catch {
		return [];
	}
}

/**
 * Returns the collection (saga) a movie belongs to, with all its parts.
 * Returns null on failure.
 */
export async function getCollection(
	id: number,
	lang?: Language
): Promise<CollectionDetails | null> {
	try {
		return await fetchTMDB<CollectionDetails>(
			`/collection/${id}`,
			{},
			{ revalidate: 604800, lang }
		);
	} catch {
		return null;
	}
}

/** @returns Available backdrop and poster images for the given movie. */
export async function getMovieImages(
	id: number,
	lang?: Language
): Promise<MediaImagesResponse> {
	const imageLanguage = await getImageLanguageFilter(lang);
	return fetchTMDB<MediaImagesResponse>(
		`/movie/${id}/images`,
		{
			include_image_language: imageLanguage,
		},
		{ revalidate: 86400, lang }
	);
}

/**
 * Returns watch providers for a movie filtered to the user's region.
 * Returns null if no providers are available for that region.
 * Data sourced from JustWatch via TMDB.
 *
 * @param id - TMDB movie ID.
 * @returns Watch providers for the user's region, or null.
 */
export async function getMovieWatchProviders(
	id: number,
	lang?: Language
): Promise<WatchProvidersRegion | null> {
	try {
		const region = await getUserRegion(lang);
		const [tmdbData, watchmode] = await Promise.all([
			fetchTMDB<WatchProvidersResponse>(
				`/movie/${id}/watch/providers`,
				{},
				{ revalidate: 43200, lang }
			),
			getWatchmodeProviders(id, 'movie', region),
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
	} catch {
		return null;
	}
}
