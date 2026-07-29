import type {
	MediaItem,
	Movie,
	PersonSuggestion,
	TvShow,
} from '@/types/tmdb';
import { fetchTMDB } from './client';
import type { Language } from '@/lib/i18n/translations';

interface TMDBMultiResult {
	id: number;
	media_type: 'movie' | 'tv' | 'person';
	title?: string;
	original_title?: string;
	release_date?: string;
	name?: string;
	original_name?: string;
	first_air_date?: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	vote_average: number;
	vote_count: number;
	popularity: number;
	genre_ids?: number[];
}

/**
 * Searches movies and TV shows via TMDB's multi-search endpoint.
 * Filters out person results and normalizes the response into `MediaItem` objects.
 *
 * @param query - Search string.
 * @param page - Page number (default: 1).
 * @param lang - Language to search in; defaults to the request-resolved one.
 * @returns Filtered and normalized list of matching movies and TV shows.
 */
export async function searchMulti(
	query: string,
	page: number = 1,
	lang?: Language
): Promise<MediaItem[]> {
	const { results } = await fetchTMDB<{ results: TMDBMultiResult[] }>(
		'/search/multi',
		{
			query,
			page: page.toString(),
		},
		{ lang }
	);

	return results
		.filter(
			(item) => item.media_type === 'movie' || item.media_type === 'tv'
		)
		.map(tmdbMultiResultToMediaItem);
}

interface TMDBPersonResult {
	id: number;
	name: string;
	profile_path: string | null;
	known_for?: Array<{ title?: string; name?: string }>;
}

const KNOWN_FOR_MAX_TITLES = 2;

/**
 * Searches people via TMDB's person endpoint, for the actor filter autocomplete.
 * Results keep TMDB's popularity order.
 *
 * @param query - Search string.
 * @param lang - Language to search in; defaults to the request-resolved one.
 * @returns Normalized person suggestions.
 */
export async function searchPeople(
	query: string,
	lang?: Language
): Promise<PersonSuggestion[]> {
	const { results } = await fetchTMDB<{ results: TMDBPersonResult[] }>(
		'/search/person',
		{ query },
		{ lang }
	);

	return results.map(tmdbPersonResultToSuggestion);
}

function tmdbPersonResultToSuggestion(
	result: TMDBPersonResult
): PersonSuggestion {
	return {
		id: result.id,
		name: result.name,
		profile_path: result.profile_path,
		knownFor: (result.known_for ?? [])
			.map((entry) => entry.title ?? entry.name ?? '')
			.filter((title) => title !== '')
			.slice(0, KNOWN_FOR_MAX_TITLES)
			.join(' · '),
	};
}

/**
 * Normalizes a TMDB `Movie` object into the app's unified `MediaItem` shape.
 *
 * @param movie - Raw TMDB movie object.
 * @returns Normalized `MediaItem` with `media_type: "movie"`.
 */
export function movieToMediaItem(movie: Movie): MediaItem {
	return {
		id: movie.id,
		media_type: 'movie',
		title: movie.title,
		original_title: movie.original_title,
		overview: movie.overview,
		poster_path: movie.poster_path,
		backdrop_path: movie.backdrop_path,
		release_date: movie.release_date,
		vote_average: movie.vote_average,
		vote_count: movie.vote_count,
		popularity: movie.popularity,
		genre_ids: movie.genre_ids,
	};
}

/**
 * Normalizes a TMDB `TvShow` object into the app's unified `MediaItem` shape.
 *
 * @param tvShow - Raw TMDB TV show object.
 * @returns Normalized `MediaItem` with `media_type: "tv"`.
 */
export function tvShowToMediaItem(tvShow: TvShow): MediaItem {
	return {
		id: tvShow.id,
		media_type: 'tv',
		title: tvShow.name,
		original_title: tvShow.original_name,
		overview: tvShow.overview,
		poster_path: tvShow.poster_path,
		backdrop_path: tvShow.backdrop_path,
		release_date: tvShow.first_air_date,
		vote_average: tvShow.vote_average,
		vote_count: tvShow.vote_count,
		popularity: tvShow.popularity,
		genre_ids: tvShow.genre_ids,
	};
}

function tmdbMultiResultToMediaItem(result: TMDBMultiResult): MediaItem {
	const isMovie = result.media_type === 'movie';
	return {
		id: result.id,
		media_type: isMovie ? 'movie' : 'tv',
		title: isMovie
			? (result.title ?? result.name ?? '')
			: (result.name ?? result.title ?? ''),
		original_title: isMovie
			? (result.original_title ?? result.title ?? '')
			: (result.original_name ?? result.name ?? ''),
		overview: result.overview,
		poster_path: result.poster_path,
		backdrop_path: result.backdrop_path,
		release_date: isMovie
			? (result.release_date ?? '')
			: (result.first_air_date ?? ''),
		vote_average: result.vote_average,
		vote_count: result.vote_count,
		popularity: result.popularity,
		genre_ids: result.genre_ids,
	};
}
