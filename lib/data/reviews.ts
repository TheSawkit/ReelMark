import 'server-only';

import { getOptionalUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { reportSwallowed } from '@/lib/report';
import { REVIEW_COLUMNS } from '@/lib/supabase/columns';
import { getMediaKey } from '@/lib/media';
import { getReviewedMediaSets, mayHaveReviews } from '@/lib/data/review-index';
import type { MediaType } from '@/types/tmdb';
import type {
	Review,
	PublicReview,
	ReviewMediaType,
	UserReviewsPage,
} from '@/types/profile';

export const REVIEWS_PAGE_SIZE = 20;
const REVIEWS_MAX_PAGE_SIZE = 50;

function parseRatingRow(data: unknown): { avg: number; count: number } | null {
	const row =
		(data as Array<{ avg: string | null; count: string }> | null)?.[0] ??
		null;
	if (!row || row.avg === null) return null;
	return { avg: Number(row.avg), count: Number(row.count) };
}

/**
 * Returns a page of reviews for a given user, newest first.
 * Pass nextCursor from the previous page to get the next batch.
 */
export async function getUserReviews(
	userId: string,
	cursor?: string,
	limit: number = REVIEWS_PAGE_SIZE
): Promise<UserReviewsPage> {
	const supabase = await createClient();
	const pageSize = Math.min(Math.max(1, limit), REVIEWS_MAX_PAGE_SIZE);

	let query = supabase
		.from('reviews')
		.select(REVIEW_COLUMNS)
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.order('id', { ascending: false })
		.limit(pageSize + 1);

	if (cursor) query = query.lt('created_at', cursor);

	const { data, error } = await query;
	if (error) throw new Error(error.message);

	const rows = (data as Review[]) ?? [];
	const hasMore = rows.length > pageSize;
	const reviews = hasMore ? rows.slice(0, pageSize) : rows;
	const nextCursor = hasMore ? reviews[reviews.length - 1].created_at : null;

	return { reviews, nextCursor };
}

export interface ReviewSignals {
	ratings: Record<string, number>;
	ratedAt: Record<string, string>;
}

/**
 * Returns a user's own movie/tv ratings keyed by media key, with when each was last rated —
 * the closest thing to a watch date the schema has, used to spot what the user saw recently.
 * Reviews RLS restricts direct reads to the user's own rows.
 *
 * @param userId - Owner of the reviews.
 * @param client - Admin client for jobs that run without a session; defaults to the request's.
 */
export async function getUserReviewSignals(
	userId: string,
	client?: SupabaseClient<Database>
): Promise<ReviewSignals> {
	const supabase = client ?? (await createClient());

	const data = await fetchAllRows((from, to) =>
		supabase
			.from('reviews')
			.select('media_id, media_type, rating, updated_at')
			.eq('user_id', userId)
			.in('media_type', ['movie', 'tv'])
			.not('rating', 'is', null)
			.order('media_type')
			.order('media_id')
			.range(from, to)
	).catch((error: unknown) => {
		reportSwallowed('reviews:ratings', error);
		return [];
	});

	const signals: ReviewSignals = { ratings: {}, ratedAt: {} };
	for (const row of data) {
		if (row.rating === null) continue;
		const key = getMediaKey({
			media_type: row.media_type as MediaType,
			id: row.media_id,
		});
		signals.ratings[key] = row.rating;
		signals.ratedAt[key] = row.updated_at;
	}
	return signals;
}

/**
 * Returns a `media_key → rating` map of a user's own movie/tv ratings, for sorting lists
 * by user rating. Reviews RLS restricts direct reads to the user's own rows, so callers
 * should only request the rating map of the list owner viewing their own profile.
 *
 * @param userId - Owner of the reviews.
 * @param client - Admin client for jobs that run without a session; defaults to the request's.
 */
export async function getUserReviewRatings(
	userId: string,
	client?: SupabaseClient<Database>
): Promise<Record<string, number>> {
	return (await getUserReviewSignals(userId, client)).ratings;
}

/** Returns the authenticated user's own `media_key → rating` map, or an empty map if signed out. */
export async function getMyReviewRatings(): Promise<Record<string, number>> {
	return (await getMyReviewSignals()).ratings;
}

/** Returns the authenticated user's ratings and rating dates, or empty maps if signed out. */
export async function getMyReviewSignals(): Promise<ReviewSignals> {
	const { userId } = await getOptionalUser();
	if (!userId) return { ratings: {}, ratedAt: {} };
	return getUserReviewSignals(userId);
}

/**
 * Returns the authenticated user's review for a specific media item, or null if none.
 */
export async function getMediaReview(
	mediaId: number,
	mediaType: ReviewMediaType
): Promise<Review | null> {
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return null;

	const { data, error } = await supabase
		.from('reviews')
		.select(REVIEW_COLUMNS)
		.eq('user_id', userId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType)
		.maybeSingle();
	if (error) reportSwallowed('reviews:mine', error);

	return (data as Review) ?? null;
}

/**
 * Returns the authenticated user's own episode reviews, keyed by episode ID, so a season
 * page can render inline ratings without one query per episode.
 */
export async function getMyEpisodeReviews(
	episodeIds: number[]
): Promise<Record<number, Review>> {
	if (episodeIds.length === 0) return {};
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return {};

	const { data, error } = await supabase
		.from('reviews')
		.select(REVIEW_COLUMNS)
		.eq('user_id', userId)
		.eq('media_type', 'episode')
		.in('media_id', episodeIds);
	if (error) reportSwallowed('reviews:mine-episodes', error);

	const byEpisodeId: Record<number, Review> = {};
	for (const review of (data ?? []) as Review[]) {
		byEpisodeId[review.media_id] = review;
	}
	return byEpisodeId;
}

/**
 * Whether an anonymous viewer's community read can be skipped. Signed-in viewers always query
 * — they may see friends-only reviews, and their own writes must show up at once — while an
 * anonymous one only ever sees public data, which exists solely for titles in the review index.
 */
async function skipForAnonymous(
	userId: string | null,
	mediaType: ReviewMediaType,
	mediaId: number
): Promise<boolean> {
	if (userId) return false;
	return !mayHaveReviews(await getReviewedMediaSets(), mediaType, mediaId);
}

/**
 * Returns the community average rating (1–10 scale) and count for a media item.
 * Returns null if no ratings exist.
 */
export async function getAverageRating(
	mediaId: number,
	mediaType: ReviewMediaType
): Promise<{ avg: number; count: number } | null> {
	const { supabase, userId } = await getOptionalUser();
	if (await skipForAnonymous(userId, mediaType, mediaId)) return null;

	const { data, error } = await supabase.rpc('get_media_rating', {
		p_media_id: mediaId,
		p_media_type: mediaType,
	});
	if (error) reportSwallowed('reviews:media-rating', error);
	return parseRatingRow(data);
}

/**
 * Returns the community average rating for a season, aggregated from its episode reviews.
 * Returns null if no episode ratings exist for this season.
 *
 * `get_season_rating` runs with the caller's rights and `reviews` is not readable by `anon`:
 * an anonymous call always failed (permission denied — 9 400 error log lines a day), so it is
 * no longer made.
 */
export async function getSeasonAverageRating(
	tvId: number,
	seasonNumber: number
): Promise<{ avg: number; count: number } | null> {
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return null;

	const { data, error } = await supabase.rpc('get_season_rating', {
		p_tv_id: tvId,
		p_season_number: seasonNumber,
	});
	if (error) reportSwallowed('reviews:season-rating', error);
	return parseRatingRow(data);
}

/**
 * Returns the community average rating for a show, aggregated from all its episode reviews.
 * Returns null if no ratings exist. Skipped when anonymous, for the reason given on
 * `getSeasonAverageRating` (15 000 failing calls a day).
 */
export async function getShowAverageRating(
	tvId: number
): Promise<{ avg: number; count: number } | null> {
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return null;

	const { data, error } = await supabase.rpc('get_show_rating', {
		p_tv_id: tvId,
	});
	if (error) reportSwallowed('reviews:show-rating', error);
	return parseRatingRow(data);
}

/**
 * Returns public reviews for a media item, filtered by the viewer's auth/friendship status.
 */
export async function getPublicReviews(
	mediaId: number,
	mediaType: ReviewMediaType
): Promise<PublicReview[]> {
	const { supabase, userId } = await getOptionalUser();
	if (await skipForAnonymous(userId, mediaType, mediaId)) return [];

	const { data, error } = await supabase.rpc('get_public_reviews', {
		p_media_id: mediaId,
		p_media_type: mediaType,
		p_viewer_id: userId ?? undefined,
	});

	if (error) return [];
	return (data as PublicReview[]) ?? [];
}

/**
 * Returns public reviews for a set of episode IDs, filtered by viewer's auth/friendship status.
 *
 * @param episodeIds - TMDB episode ids of the season.
 * @param tvId - Their show, which lets an anonymous render skip the read when no episode of the
 *   show was ever reviewed.
 */
export async function getPublicEpisodeReviews(
	episodeIds: number[],
	tvId?: number
): Promise<PublicReview[]> {
	if (episodeIds.length === 0) return [];
	const { supabase, userId } = await getOptionalUser();
	if (!userId && tvId !== undefined) {
		const sets = await getReviewedMediaSets();
		if (!sets?.episodeShows.has(tvId)) return [];
	}

	const { data, error } = await supabase.rpc('get_public_episode_reviews', {
		p_episode_ids: episodeIds,
		p_viewer_id: userId ?? undefined,
	});

	if (error) return [];
	return (data as PublicReview[]) ?? [];
}
