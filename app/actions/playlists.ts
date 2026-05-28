'use server';

import {
  getAuthenticatedUser,
  getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import { revalidateProfile } from '@/app/actions/_helpers';
import { parseVisibility, isVisibility } from '@/lib/privacy';
import type { MediaType } from '@/types/tmdb';
import type { Playlist, PrivacyVisibility } from '@/types/profile';

/**
 * Returns all playlists for a given user visible to the current viewer, newest first.
 * RLS automatically filters by per-playlist visibility.
 *
 * @param userId - Supabase user ID.
 * @returns Array of Playlist objects with nested items.
 */
export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const { supabase } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('playlists')
    .select('*, items:playlist_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data as Playlist[]) ?? [];
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

  const adminClient = createAdminClient();
  const [profileResult, ownerAuth] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('username')
      .eq('user_id', data.user_id)
      .maybeSingle(),
    adminClient.auth.admin.getUserById(data.user_id),
  ]);

  const ownerUsername = profileResult.data?.username ?? null;
  const ownerAvatarUrl =
    typeof ownerAuth.data.user?.user_metadata?.avatar_url === 'string'
      ? ownerAuth.data.user.user_metadata.avatar_url
      : null;

  return {
    playlist: data as Playlist,
    isOwn: userId === data.user_id,
    ownerUsername,
    ownerAvatarUrl,
  };
}

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

  const { supabase, userId } = await getAuthenticatedUser();

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
  await revalidateProfile(supabase);
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

  const { supabase, userId } = await getAuthenticatedUser();

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
  await revalidateProfile(supabase);
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

  const { supabase, userId } = await getAuthenticatedUser();

  const { error } = await supabase
    .from('playlists')
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq('id', playlistId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  await revalidateProfile(supabase);
}

/**
 * Deletes a playlist owned by the authenticated user.
 *
 * @param playlistId - UUID of the playlist.
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  const { supabase, userId } = await getAuthenticatedUser();

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  await revalidateProfile(supabase);
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
  const { supabase, userId } = await getAuthenticatedUser();

  const { data: playlist } = await supabase
    .from('playlists')
    .select('user_id')
    .eq('id', playlistId)
    .maybeSingle();

  if (!playlist || playlist.user_id !== userId)
    throw new Error(t.profile.errors.playlistNotFound);

  const { error } = await supabase.from('playlist_items').upsert(
    {
      playlist_id: playlistId,
      media_id: mediaId,
      media_type: mediaType,
      media_title: mediaTitle,
      poster_path: posterPath,
    },
    { onConflict: 'playlist_id,media_id,media_type' }
  );

  if (error) throw new Error(error.message);
  await revalidateProfile(supabase);
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
  const { supabase, userId } = await getAuthenticatedUser();

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
  await revalidateProfile(supabase);
}
