'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { getTranslations } from '@/lib/i18n/server';
import {
	revalidateProfileAfterResponse,
	revalidatePlaylistMetaAfterResponse,
} from '@/app/actions/_helpers';
import { parseVisibility, isVisibility } from '@/lib/privacy';
import { getListMediaMetadata } from '@/lib/tmdb';
import type { MediaType } from '@/types/tmdb';
import type { PrivacyVisibility } from '@/types/profile';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

/**
 * Creates a new playlist for the authenticated user.
 * Defaults visibility to the user's privacy_settings.playlists_visibility, or 'private'.
 *
 * @param name - Playlist name (1–100 chars).
 * @param description - Optional description (max 500 chars).
 * @param visibility - Visibility level; if omitted, inherits from user privacy settings.
 */
export async function createPlaylist(
	name: string,
	description: string | null,
	visibility?: PrivacyVisibility
): Promise<void> {
	const t = await getTranslations();
	if (!name.trim() || name.length > 100)
		throw new Error(t.profile.errors.playlistNameInvalid);
	if (description && description.length > 500)
		throw new Error(t.profile.errors.descriptionTooLong);

	const { supabase, userId, user } = await getAuthenticatedUser();

	let resolvedVisibility: PrivacyVisibility;
	if (visibility && isVisibility(visibility)) {
		resolvedVisibility = visibility;
	} else {
		const { data: privacyData } = await supabase
			.from('privacy_settings')
			.select('playlists_visibility')
			.eq('user_id', userId)
			.maybeSingle();
		resolvedVisibility = parseVisibility(
			privacyData?.playlists_visibility,
			'private'
		);
	}

	const { error } = await supabase.from('playlists').insert({
		user_id: userId,
		name,
		description,
		visibility: resolvedVisibility,
	});

	if (error) throw new Error(error.message);
	revalidateProfileAfterResponse(supabase, user);
}

/**
 * Updates a playlist's name, description, and optionally visibility.
 *
 * @param playlistId - UUID of the playlist.
 * @param name - New name (1–100 chars).
 * @param description - New description (max 500 chars), or null.
 * @param visibility - New visibility level (optional).
 */
export async function updatePlaylist(
	playlistId: string,
	name: string,
	description: string | null,
	visibility?: PrivacyVisibility
): Promise<void> {
	const t = await getTranslations();
	const trimmedName = name.trim();
	if (!trimmedName || trimmedName.length > 100)
		throw new Error(t.profile.errors.playlistNameInvalid);
	if (description && description.length > 500)
		throw new Error(t.profile.errors.descriptionTooLong);

	const { supabase, userId, user } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('playlists')
		.update({
			name: trimmedName,
			description: description?.trim() || null,
			updated_at: new Date().toISOString(),
			visibility:
				visibility && isVisibility(visibility) ? visibility : undefined,
		})
		.eq('id', playlistId)
		.eq('user_id', userId);

	if (error) throw new Error(error.message);
	revalidateProfileAfterResponse(supabase, user);
	revalidatePlaylistMetaAfterResponse(playlistId);
}

/**
 * Updates only the visibility of a playlist owned by the authenticated user.
 *
 * @param playlistId - UUID of the playlist.
 * @param visibility - New visibility level.
 */
export async function updatePlaylistVisibility(
	playlistId: string,
	visibility: PrivacyVisibility
): Promise<void> {
	const t = await getTranslations();
	if (!isVisibility(visibility))
		throw new Error(t.profile.errors.invalidVisibility);

	const { supabase, userId, user } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('playlists')
		.update({ visibility, updated_at: new Date().toISOString() })
		.eq('id', playlistId)
		.eq('user_id', userId);

	if (error) throw new Error(error.message);
	revalidateProfileAfterResponse(supabase, user);
	revalidatePlaylistMetaAfterResponse(playlistId);
}

/**
 * Deletes a playlist owned by the authenticated user.
 *
 * @param playlistId - UUID of the playlist.
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
	const { supabase, userId, user } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('playlists')
		.delete()
		.eq('id', playlistId)
		.eq('user_id', userId);

	if (error) throw new Error(error.message);
	revalidateProfileAfterResponse(supabase, user);
	revalidatePlaylistMetaAfterResponse(playlistId);
}

/**
 * Adds a media item to a playlist owned by the authenticated user.
 *
 * @param playlistId - UUID of the target playlist.
 * @param mediaId - TMDB media ID.
 * @param mediaType - 'movie' or 'tv'.
 * @param mediaTitle - Display title.
 * @param posterPath - TMDB poster path, or null.
 */
export async function addToPlaylist(
	playlistId: string,
	mediaId: number,
	mediaType: MediaType,
	mediaTitle: string,
	posterPath: string | null
): Promise<void> {
	const t = await getTranslations();
	const { supabase, userId, user } = await getAuthenticatedUser();

	const { data: playlist } = await supabase
		.from('playlists')
		.select('user_id')
		.eq('id', playlistId)
		.maybeSingle();

	if (!playlist || playlist.user_id !== userId)
		throw new Error(t.profile.errors.playlistNotFound);

	const { release_date, genre_ids } = await getListMediaMetadata(
		mediaId,
		mediaType
	);

	const { error } = await supabase.from('playlist_items').upsert(
		{
			playlist_id: playlistId,
			media_id: mediaId,
			media_type: mediaType,
			media_title: mediaTitle,
			poster_path: posterPath,
			release_date,
			genre_ids,
		},
		{ onConflict: ON_CONFLICT.playlistItems }
	);

	if (error) throw new Error(error.message);
	revalidateProfileAfterResponse(supabase, user);
	revalidatePlaylistMetaAfterResponse(playlistId);
}

/**
 * Removes a media item from a playlist owned by the authenticated user.
 *
 * @param playlistId - UUID of the playlist.
 * @param mediaId - TMDB media ID.
 * @param mediaType - 'movie' or 'tv'.
 */
export async function removeFromPlaylist(
	playlistId: string,
	mediaId: number,
	mediaType: MediaType
): Promise<void> {
	const t = await getTranslations();
	const { supabase, userId, user } = await getAuthenticatedUser();

	const { data: playlist } = await supabase
		.from('playlists')
		.select('user_id')
		.eq('id', playlistId)
		.maybeSingle();

	if (!playlist || playlist.user_id !== userId)
		throw new Error(t.profile.errors.playlistNotFound);

	const { error } = await supabase
		.from('playlist_items')
		.delete()
		.eq('playlist_id', playlistId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType);

	if (error) throw new Error(error.message);
	revalidateProfileAfterResponse(supabase, user);
	revalidatePlaylistMetaAfterResponse(playlistId);
}
