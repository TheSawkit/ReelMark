import 'server-only';

import { getListMediaMetadata } from '@/lib/tmdb';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { MediaType, WatchStatus } from '@/types/tmdb';

export interface WatchlistWrite {
	mediaId: number;
	mediaType: MediaType;
	mediaTitle: string;
	posterPath: string | null;
	status: WatchStatus;
}

/**
 * Adds a title to a user's library or changes its status, with the TMDB metadata lists sort and
 * filter on. Shared by the Server Actions (session client) and the AI link (admin client, scoped
 * by `userId` here since RLS does not apply to it).
 */
export async function upsertWatchlistEntry(
	supabase: SupabaseClient<Database>,
	userId: string,
	{ mediaId, mediaType, mediaTitle, posterPath, status }: WatchlistWrite
): Promise<void> {
	const { release_date, genre_ids, total_episodes } =
		await getListMediaMetadata(mediaId, mediaType);

	const { error } = await supabase.from('watchlist').upsert(
		{
			user_id: userId,
			media_id: mediaId,
			media_title: mediaTitle,
			poster_path: posterPath,
			status,
			media_type: mediaType,
			total_episodes,
			release_date,
			genre_ids,
		},
		{ onConflict: ON_CONFLICT.watchlist }
	);
	if (error) throw new Error(error.message);
}

/** Removes a title from a user's library — for a show, its episode progress goes with it. */
export async function deleteWatchlistEntry(
	supabase: SupabaseClient<Database>,
	userId: string,
	mediaId: number,
	mediaType: MediaType
): Promise<void> {
	const { error } = await supabase
		.from('watchlist')
		.delete()
		.eq('user_id', userId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType);
	if (error) throw new Error(error.message);

	if (mediaType === 'tv') {
		const { error: progressError } = await supabase
			.from('episode_watches')
			.delete()
			.eq('user_id', userId)
			.eq('tv_id', mediaId);
		if (progressError) throw new Error(progressError.message);
	}
}
