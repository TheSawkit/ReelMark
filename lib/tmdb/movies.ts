import type {
	Movie,
	MovieDetails,
	CollectionDetails,
	Credits,
	Video,
	ReleaseDatesResponse,
	MediaImagesResponse,
	WatchProvidersRegion,
} from '@/types/tmdb';
import {
	fetchTMDB,
	getUserRegion,
	clampPage,
	getMergeRegions,
	REVALIDATE,
} from './client';
import {
	fetchMediaCredits,
	fetchMediaDetails,
	fetchMediaImages,
	fetchMediaPage,
	fetchMediaVideos,
	fetchRelatedMedia,
	fetchWatchProviders,
} from './media-endpoints';
import {
	THEATRICAL_RELEASE_TYPES,
	inTheatersDates,
	upcomingDates,
} from './release-window';
import { reportSwallowed } from '@/lib/report';
import type { Language } from '@/lib/i18n/translations';
import { findLocalCertification } from './certifications';

/** @returns Paginated list of popular movies. */
export async function getPopularMovies(
	page: number = 1,
	lang?: Language
): Promise<Movie[]> {
	return fetchMediaPage<Movie>('/movie/popular', page, lang);
}

/** @returns Paginated list of top-rated movies. */
export async function getTopRatedMovies(
	page: number = 1,
	lang?: Language
): Promise<Movie[]> {
	return fetchMediaPage<Movie>('/movie/top_rated', page, lang);
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
	return fetchMediaPage<Movie>(`/trending/movie/${timeWindow}`, page, lang);
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

	const { results } = await fetchTMDB<{ results: Movie[] }>(
		'/discover/movie',
		{
			page: clampPage(page).toString(),
			region,
			...upcomingDates(new Date()),
			sort_by: 'popularity.desc',
			with_release_type: THEATRICAL_RELEASE_TYPES,
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
	const dates = inTheatersDates(new Date());

	const responses = await Promise.all(
		(getMergeRegions(region) ?? [region]).map((r) =>
			fetchTMDB<{ results: Movie[] }>(
				'/discover/movie',
				{
					page: clampPage(page).toString(),
					region: r,
					...dates,
					sort_by: 'popularity.desc',
					with_release_type: THEATRICAL_RELEASE_TYPES,
				},
				{ lang }
			)
		)
	);

	const byId = new Map<number, Movie>();
	for (const { results } of responses) {
		for (const movie of results) byId.set(movie.id, movie);
	}

	return [...byId.values()].sort((a, b) => b.popularity - a.popularity);
}

/**
 * Full movie details. Viewer-independent and cached, so a detail page can prerender its
 * shell — the age certification lives in `getMovieCertification`.
 *
 * @param id - TMDB movie ID.
 */
export async function getMovieDetails(
	id: number,
	lang?: Language
): Promise<MovieDetails> {
	return fetchMediaDetails<MovieDetails>('movie', id, lang);
}

/**
 * Age certification for the viewer's own region, resolved separately from the details fetch.
 * It reads the session, so awaiting it outside a Suspense boundary would stop the detail
 * page from prerendering a static shell.
 */
export async function getMovieCertification(
	id: number,
	lang?: Language
): Promise<string | undefined> {
	try {
		const [releaseDates, userRegion] = await Promise.all([
			fetchTMDB<ReleaseDatesResponse>(
				`/movie/${id}/release_dates`,
				{},
				{ revalidate: REVALIDATE.day, lang }
			),
			getUserRegion(lang),
		]);
		return findLocalCertification(releaseDates, userRegion);
	} catch (error) {
		reportSwallowed('tmdb/movies:certification', error);
		return undefined;
	}
}

/** @returns Cast and crew credits for the given movie. */
export async function getMovieCredits(
	id: number,
	lang?: Language
): Promise<Credits> {
	return fetchMediaCredits('movie', id, lang);
}

/** @returns Official video trailers and clips for the given movie. */
export async function getMovieVideos(
	id: number,
	lang?: Language
): Promise<Video[]> {
	return fetchMediaVideos('movie', id, lang);
}

/**
 * Returns recommended movies based on a given movie.
 * Returns an empty array on failure.
 */
export async function getMovieRecommendations(
	id: number,
	lang?: Language,
	page = 1
): Promise<Movie[]> {
	return fetchRelatedMedia<Movie>('movie', 'recommendations', id, lang, page);
}

/**
 * Returns movies similar to the given movie.
 * Returns an empty array on failure.
 */
export async function getSimilarMovies(
	id: number,
	lang?: Language,
	page = 1
): Promise<Movie[]> {
	return fetchRelatedMedia<Movie>('movie', 'similar', id, lang, page);
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
			{ revalidate: REVALIDATE.week, lang }
		);
	} catch (error) {
		reportSwallowed('tmdb/movies:collection', error);
		return null;
	}
}

/** @returns Available backdrop and poster images for the given movie. */
export async function getMovieImages(
	id: number,
	lang?: Language
): Promise<MediaImagesResponse> {
	return fetchMediaImages('movie', id, lang);
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
	return fetchWatchProviders('movie', id, lang);
}
