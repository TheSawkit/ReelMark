import { cache } from 'react';
import { fetchTMDB, REVALIDATE } from './client';
import type { Language } from '@/lib/i18n/translations';

interface GenreListResponse {
	genres: Array<{ id: number; name: string }>;
}

/**
 * Returns a merged TMDB genre id → localized name map covering movies and TV shows,
 * used to label genre filters. Pass `lang` from the route params to keep the caller static.
 * Request-deduped and cached for a week (the genre list is effectively static).
 */
export const getGenres = cache(
	async (lang?: Language): Promise<Record<number, string>> => {
		const [movie, tv] = await Promise.all([
			fetchTMDB<GenreListResponse>(
				'/genre/movie/list',
				{},
				{ revalidate: REVALIDATE.week, lang }
			),
			fetchTMDB<GenreListResponse>(
				'/genre/tv/list',
				{},
				{ revalidate: REVALIDATE.week, lang }
			),
		]);

		const map: Record<number, string> = {};
		for (const genre of [...movie.genres, ...tv.genres]) {
			map[genre.id] = genre.name;
		}
		return map;
	}
);
