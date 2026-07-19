'use server';

import {
	getAuthenticatedUser,
	getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import { revalidateLocalizedAfterResponse } from '@/app/actions/_helpers';
import { VALID_MEDIA_TYPES } from '@/lib/validators';
import type { MediaType } from '@/types/tmdb';

const MAX_GENRE_IDS = 10;
const MAX_PROVIDER_IDS = 100;

export interface RecommendationDismissal {
	media_id: number;
	media_type: MediaType;
	genre_ids: number[];
}

/**
 * Marks a recommended title as "not interested": it never comes back and its
 * genres feed the negative signal of the recommendation engine.
 */
export async function dismissRecommendation(
	mediaId: number,
	mediaType: MediaType,
	genreIds: number[]
): Promise<void> {
	if (!VALID_MEDIA_TYPES.has(mediaType))
		throw new Error('Invalid media_type');
	if (!Number.isInteger(mediaId) || mediaId <= 0)
		throw new Error('Invalid media_id');

	const { supabase, userId } = await getAuthenticatedUser();

	const sanitizedGenres = genreIds
		.filter((id) => Number.isInteger(id) && id > 0)
		.slice(0, MAX_GENRE_IDS);

	const { error } = await supabase.from('recommendation_dismissals').upsert(
		{
			user_id: userId,
			media_id: mediaId,
			media_type: mediaType,
			genre_ids: sanitizedGenres,
		},
		{ onConflict: 'user_id,media_id,media_type' }
	);
	if (error) throw new Error(error.message);

	revalidateLocalizedAfterResponse(['/dashboard']);
}

/** Returns every title the user dismissed from recommendations. */
export async function getMyDismissals(): Promise<RecommendationDismissal[]> {
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return [];

	const { data } = await supabase
		.from('recommendation_dismissals')
		.select('media_id, media_type, genre_ids')
		.eq('user_id', userId);

	return (data ?? []).map((row) => ({
		media_id: row.media_id,
		media_type: row.media_type as MediaType,
		genre_ids: row.genre_ids,
	}));
}

/** Returns the TMDB provider IDs of the user's streaming services. */
export async function getMyStreamingProviders(): Promise<number[]> {
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return [];

	const { data } = await supabase
		.from('user_streaming_providers')
		.select('provider_ids')
		.eq('user_id', userId)
		.maybeSingle();

	return data?.provider_ids ?? [];
}

/** Replaces the user's streaming services selection. */
export async function updateStreamingProviders(
	providerIds: number[]
): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();

	const sanitized = [
		...new Set(providerIds.filter((id) => Number.isInteger(id) && id > 0)),
	].slice(0, MAX_PROVIDER_IDS);

	const { error } = await supabase.from('user_streaming_providers').upsert({
		user_id: userId,
		provider_ids: sanitized,
		updated_at: new Date().toISOString(),
	});
	if (error) throw new Error(error.message);

	revalidateLocalizedAfterResponse(['/dashboard', '/settings']);
}
