import type { MediaItem } from '@/types/tmdb';

/**
 * Builds a stable composite key for a TMDB media item, suitable for
 * deduplication (Set) and React list keys.
 *
 * @param item - Object exposing `media_type` and `id`.
 * @returns String of the form `"movie-123"` or `"tv-456"`.
 */
export function getMediaKey(
	item: Pick<MediaItem, 'media_type' | 'id'>
): string {
	return `${item.media_type}-${item.id}`;
}

/**
 * Returns the canonical app route for a media item's detail page.
 *
 * @param item - Object exposing `media_type` and `id`.
 * @returns `/tv/{id}` for TV shows, `/movie/{id}` for movies.
 */
export function getMediaHref(
	item: Pick<MediaItem, 'media_type' | 'id'>
): string {
	return item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
}
