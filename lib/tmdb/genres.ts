import { cache } from 'react';
import { fetchTMDB } from './client';

interface GenreListResponse {
	genres: Array<{ id: number; name: string }>;
}

const GENRES_REVALIDATE = 604800;

/**
 * Returns a merged TMDB genre id → localized name map covering movies and TV shows,
 * used to label genre filters. Names are localized via `fetchTMDB`'s injected language.
 * Request-deduped and cached for a week (the genre list is effectively static).
 */
export const getGenres = cache(async (): Promise<Record<number, string>> => {
	const [movie, tv] = await Promise.all([
		fetchTMDB<GenreListResponse>(
			'/genre/movie/list',
			{},
			GENRES_REVALIDATE
		),
		fetchTMDB<GenreListResponse>('/genre/tv/list', {}, GENRES_REVALIDATE),
	]);

	const map: Record<number, string> = {};
	for (const genre of [...movie.genres, ...tv.genres]) {
		map[genre.id] = genre.name;
	}
	return map;
});
