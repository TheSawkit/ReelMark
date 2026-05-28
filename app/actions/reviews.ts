'use server';

import {
	getAuthenticatedUser,
	getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import {
	validateRating,
	validateReviewContent,
	validateUUID,
} from '@/lib/validators';
import { revalidateProfile } from '@/app/actions/_helpers';
import { getTvShowDetails, getSeasonDetails } from '@/lib/tmdb/tv';
import { MAX_REVIEW_LENGTH } from '@/types/profile';
import type {
	Review,
	PublicReview,
	ReviewMediaType,
	UserReviewsPage,
} from '@/types/profile';
import { REVIEW_COLUMNS } from '@/lib/supabase/columns';

function parseRatingRow(data: unknown): { avg: number; count: number } | null {
	const row =
		(data as Array<{ avg: string | null; count: string }> | null)?.[0] ??
		null;
	if (!row || row.avg === null) return null;
	return { avg: Number(row.avg), count: Number(row.count) };
}

const REVIEWS_PAGE_SIZE = 20;
const REVIEWS_MAX_PAGE_SIZE = 50;

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

/**
 * Returns the authenticated user's review for a specific media item, or null if none.
 */
export async function getMediaReview(
	mediaId: number,
	mediaType: ReviewMediaType
): Promise<Review | null> {
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return null;

	const { data } = await supabase
		.from('reviews')
		.select(REVIEW_COLUMNS)
		.eq('user_id', userId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType)
		.maybeSingle();

	return (data as Review) ?? null;
}

/**
 * Returns the community average rating (1–10 scale) and count for a media item.
 * Returns null if no ratings exist.
 */
export async function getAverageRating(
	mediaId: number,
	mediaType: ReviewMediaType
): Promise<{ avg: number; count: number } | null> {
	const supabase = await createClient();

	const { data } = await supabase.rpc('get_media_rating', {
		p_media_id: mediaId,
		p_media_type: mediaType,
	});
	return parseRatingRow(data);
}

/**
 * Returns the community average rating for a season, computed from episode ratings.
 * Returns null if no episode ratings exist for this season.
 */
export async function getSeasonAverageRating(
	tvId: number,
	seasonNumber: number
): Promise<{ avg: number; count: number } | null> {
	const supabase = await createClient();

	const season = await getSeasonDetails(tvId, seasonNumber);
	const episodeIds = season.episodes.map((e) => e.id);
	if (episodeIds.length === 0) return null;

	const { data } = await supabase.rpc('get_episodes_rating', {
		p_episode_ids: episodeIds,
	});
	return parseRatingRow(data);
}

/**
 * Returns the community average rating for a show, computed from all episode ratings.
 * Returns null if no ratings exist.
 */
export async function getShowAverageRating(
	tvId: number
): Promise<{ avg: number; count: number } | null> {
	const supabase = await createClient();

	const show = await getTvShowDetails(tvId);
	const regularSeasons =
		show.seasons?.filter((s) => s.season_number !== 0) ?? [];
	if (regularSeasons.length === 0) return null;

	const seasonDetails = await Promise.all(
		regularSeasons.map((s) => getSeasonDetails(tvId, s.season_number))
	);

	const allEpisodeIds = seasonDetails.flatMap((s) =>
		s.episodes.map((e) => e.id)
	);
	if (allEpisodeIds.length === 0) return null;

	const { data } = await supabase.rpc('get_episodes_rating', {
		p_episode_ids: allEpisodeIds,
	});
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
 */
export async function getPublicEpisodeReviews(
	episodeIds: number[]
): Promise<PublicReview[]> {
	if (episodeIds.length === 0) return [];
	const { supabase, userId } = await getOptionalUser();

	const { data, error } = await supabase.rpc('get_public_episode_reviews', {
		p_episode_ids: episodeIds,
		p_viewer_id: userId ?? undefined,
	});

	if (error) return [];
	return (data as PublicReview[]) ?? [];
}

/**
 * Creates or updates a review. Rating stored as 1–10 integer; display as 0.5–5.0 stars.
 */
export async function upsertReview(
	mediaId: number,
	mediaType: ReviewMediaType,
	mediaTitle: string,
	posterPath: string | null,
	rating: number | null,
	content: string | null
): Promise<void> {
	const t = await getTranslations();
	if (!(['movie', 'tv', 'episode'] as const).includes(mediaType)) {
		throw new Error('Invalid media type');
	}
	if (rating !== null && validateRating(rating) === null) {
		throw new Error(t.profile.errors.ratingInvalid);
	}
	if (content !== null && content.length > MAX_REVIEW_LENGTH) {
		throw new Error(t.profile.errors.reviewTooLong);
	}
	const cleanedContent = validateReviewContent(content);

	const { supabase, userId } = await getAuthenticatedUser();

	const { error } = await supabase.from('reviews').upsert(
		{
			user_id: userId,
			media_id: mediaId,
			media_type: mediaType,
			media_title: mediaTitle,
			poster_path: posterPath,
			rating,
			content: cleanedContent,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: 'user_id,media_id,media_type' }
	);

	if (error) throw new Error(error.message);
	await revalidateProfile(supabase);
}

/**
 * Deletes a review owned by the authenticated user.
 */
export async function deleteReview(reviewId: string): Promise<void> {
	if (validateUUID(reviewId) === null) throw new Error('Invalid review ID');

	const { supabase, userId } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('reviews')
		.delete()
		.eq('id', reviewId)
		.eq('user_id', userId);

	if (error) throw new Error(error.message);
	await revalidateProfile(supabase);
}
