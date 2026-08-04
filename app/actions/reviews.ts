'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { getTranslations } from '@/lib/i18n/server';
import { getUserReviews as readUserReviewsPage } from '@/lib/data/reviews';
import {
	validateRating,
	validateReviewContent,
	validateUUID,
} from '@/lib/validators';
import { revalidateProfileAfterResponse } from '@/app/actions/_helpers';
import { MAX_REVIEW_LENGTH } from '@/types/profile';
import type { Review, ReviewMediaType, UserReviewsPage } from '@/types/profile';
import { REVIEW_COLUMNS } from '@/lib/supabase/columns';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

/**
 * Cursor-paginated page of a user's reviews, for the profile list's "load more" button.
 * Only review read reachable from the client — every other read is server-rendered.
 */
export async function getUserReviews(
	userId: string,
	cursor?: string
): Promise<UserReviewsPage> {
	return readUserReviewsPage(userId, cursor);
}

/**
 * Creates or updates a review and returns the stored row. Rating stored as 1–10 integer;
 * display as 0.5–5.0 stars.
 */
export async function upsertReview(
	mediaId: number,
	mediaType: ReviewMediaType,
	mediaTitle: string,
	posterPath: string | null,
	rating: number | null,
	content: string | null,
	tvId: number | null = null,
	seasonNumber: number | null = null
): Promise<Review> {
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

	const { supabase, userId, user } = await getAuthenticatedUser();

	const isEpisode = mediaType === 'episode';
	const { data, error } = await supabase
		.from('reviews')
		.upsert(
			{
				user_id: userId,
				media_id: mediaId,
				media_type: mediaType,
				media_title: mediaTitle,
				poster_path: posterPath,
				rating,
				content: cleanedContent,
				tv_id: isEpisode ? tvId : null,
				season_number: isEpisode ? seasonNumber : null,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: ON_CONFLICT.reviews }
		)
		.select(REVIEW_COLUMNS)
		.single();

	if (error) throw new Error(error.message);
	revalidateProfileAfterResponse(supabase, user);
	return data as Review;
}

/**
 * Deletes a review owned by the authenticated user.
 */
export async function deleteReview(reviewId: string): Promise<void> {
	if (validateUUID(reviewId) === null) throw new Error('Invalid review ID');

	const { supabase, userId, user } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('reviews')
		.delete()
		.eq('id', reviewId)
		.eq('user_id', userId);

	if (error) throw new Error(error.message);
	revalidateProfileAfterResponse(supabase, user);
}
