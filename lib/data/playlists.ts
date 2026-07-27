import 'server-only';

import {
	getAuthenticatedUser,
	getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { resolveAvatarUrl } from '@/lib/avatar';
import type { Playlist } from '@/types/profile';

/**
 * Returns all playlists for a given user visible to the current viewer, newest first.
 * RLS automatically filters by per-playlist visibility.
 *
 * @param userId - Supabase user ID.
 * @returns Array of Playlist objects with nested items.
 */
export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
	const { supabase } = await getAuthenticatedUser();

	const data = await fetchAllRows((from, to) =>
		supabase
			.from('playlists')
			.select('*, items:playlist_items(*)')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.order('id')
			.range(from, to)
	);

	return data as Playlist[];
}

/**
 * Returns a single playlist with items and owner username, or null if inaccessible.
 * RLS enforces per-playlist visibility for the current viewer (anon or authenticated).
 *
 * @param id - UUID of the playlist.
 */
export async function getPlaylistById(id: string): Promise<{
	playlist: Playlist;
	isOwn: boolean;
	ownerUsername: string | null;
	ownerAvatarUrl: string | null;
} | null> {
	const { supabase, userId } = await getOptionalUser();

	const { data } = await supabase
		.from('playlists')
		.select('*, items:playlist_items(*)')
		.eq('id', id)
		.maybeSingle();

	if (!data) return null;

	const { data: ownerProfile } = await supabase
		.from('user_profiles')
		.select('username, avatar_url')
		.eq('user_id', data.user_id)
		.maybeSingle();

	const ownerUsername = ownerProfile?.username ?? null;
	const ownerAvatarUrl = resolveAvatarUrl(ownerProfile?.avatar_url, null);

	return {
		playlist: data as Playlist,
		isOwn: userId === data.user_id,
		ownerUsername,
		ownerAvatarUrl,
	};
}
