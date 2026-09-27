import {
	getMovieRecommendations,
	getTvShowRecommendations,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import type {
	RecommendationSeed,
	SeedCandidates,
} from '@/lib/recommendations/engine';
import type { Language } from '@/lib/i18n/translations';
import type { MediaItem, MediaType, Movie, TvShow } from '@/types/tmdb';

/** Maps a TMDB movie or show list to display items. */
export function toMediaItems(
	results: Movie[] | TvShow[],
	type: MediaType
): MediaItem[] {
	return type === 'movie'
		? (results as Movie[]).map(movieToMediaItem)
		: (results as TvShow[]).map(tvShowToMediaItem);
}

/** Fetches one page of TMDB recommendations per seed, each tagged with the seed it came from — shared by the dashboard and the weekly suggestion. */
export async function fetchSeedCandidates(
	type: MediaType,
	seeds: RecommendationSeed[],
	lang: Language,
	page = 1
): Promise<SeedCandidates[]> {
	const getRecommendations =
		type === 'movie' ? getMovieRecommendations : getTvShowRecommendations;
	const results = await Promise.all(
		seeds.map(({ entry }) => getRecommendations(entry.media_id, lang, page))
	);
	return seeds.map(({ weight, entry, reason }, index) => ({
		weight,
		because: { title: entry.media_title, reason },
		items: toMediaItems(results[index], type),
	}));
}
