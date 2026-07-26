import 'server-only';

import { getOptionalUser } from '@/lib/supabase/auth-helpers';
import type { MediaType } from '@/types/tmdb';

export interface RecommendationDismissal {
	media_id: number;
	media_type: MediaType;
	genre_ids: number[];
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
