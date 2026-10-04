import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { reportSwallowed } from '@/lib/report';
import type { ReviewMediaType } from '@/types/profile';

export const REVIEW_INDEX_TAG = 'reviewed-media-index';

interface ReviewedMediaIndex {
	movies: number[];
	shows: number[];
	/** Shows with at least one episode review. */
	episodeShows: number[];
}

export interface ReviewedMediaSets {
	movies: ReadonlySet<number>;
	shows: ReadonlySet<number>;
	episodeShows: ReadonlySet<number>;
}

/**
 * Every title that has at least one rating or review, shared by all anonymous renders.
 *
 * Detail pages are mostly rendered for crawlers — ~75 000 anonymous renders a day, three
 * community RPCs each, answering "nothing" for all but a few dozen titles. One cached read a
 * minute per pod replaces them. Reads through the service role: the page caches it for every
 * visitor, so it cannot depend on the viewer's cookie.
 */
async function loadReviewedMediaIndex(): Promise<ReviewedMediaIndex | null> {
	'use cache';
	cacheTag(REVIEW_INDEX_TAG);
	cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

	try {
		const { data, error } = await createAdminClient().rpc(
			'reviewed_media_index'
		);
		if (error) throw new Error(error.message);
		const row = data?.[0];
		return {
			movies: row?.movie_ids ?? [],
			shows: row?.tv_ids ?? [],
			episodeShows: row?.episode_tv_ids ?? [],
		};
	} catch (error) {
		reportSwallowed('reviews:index', error);
		// Lowest cacheLife wins: a failure is retried within the minute.
		cacheLife({ stale: 30, revalidate: 30, expire: 60 });
		return null;
	}
}

/**
 * The index as sets, once per request. Null when it could not be read — callers then skip the
 * anonymous community reads: if the index is unreachable, so is the database behind the RPCs.
 */
export const getReviewedMediaSets = cache(
	async (): Promise<ReviewedMediaSets | null> => {
		const index = await loadReviewedMediaIndex();
		if (!index) return null;
		return {
			movies: new Set(index.movies),
			shows: new Set(index.shows),
			episodeShows: new Set(index.episodeShows),
		};
	}
);

/**
 * Whether a title may have anything for an anonymous visitor to see. Episode ids are not
 * indexed (they are looked up by show through `episodeShows`), so they always answer true.
 */
export function mayHaveReviews(
	sets: ReviewedMediaSets | null,
	mediaType: ReviewMediaType,
	mediaId: number
): boolean {
	if (!sets) return false;
	if (mediaType === 'movie') return sets.movies.has(mediaId);
	if (mediaType === 'tv') return sets.shows.has(mediaId);
	return true;
}
