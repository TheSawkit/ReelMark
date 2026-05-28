import type { MediaImagesResponse } from '@/types/tmdb';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

export type TMDBImageSize =
	| 'w92'
	| 'w154'
	| 'w185'
	| 'w342'
	| 'w500'
	| 'w780'
	| 'w1280'
	| 'original';

/** Builds a full TMDB image URL; returns the placeholder SVG when path is null or empty. */
export function getImageUrl(path: string | null, size: TMDBImageSize = 'w500') {
	if (!path) return '/poster-placeholder.svg';

	return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
}

/** Selects the highest-ranked alternative backdrop, excluding the current one to vary visuals. */
export function selectHeroImage(
	images: MediaImagesResponse,
	defaultBackdrop: string | null
): string {
	const sortedBackdrops = [...(images.backdrops || [])]
		.filter((img) => img.file_path !== defaultBackdrop)
		.sort((a, b) => {
			if (b.vote_average !== a.vote_average)
				return b.vote_average - a.vote_average;
			return b.vote_count - a.vote_count;
		});

	return sortedBackdrops.length > 0
		? sortedBackdrops[0].file_path
		: defaultBackdrop || '';
}
