import { unstable_cache } from 'next/cache';
import { getTvShowDetails } from '@/lib/tmdb/tv';

const TV_DETAILS_TTL_SECONDS = 300;

/**
 * TV show details shared by every server action that only needs the season/episode
 * structure, kept in a single cache entry so the same show is fetched once.
 */
export const getCachedTvShowDetails = unstable_cache(
	(tvId: number) => getTvShowDetails(tvId),
	['tv-show-details'],
	{ revalidate: TV_DETAILS_TTL_SECONDS }
);
