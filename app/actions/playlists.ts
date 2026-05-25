'use server'

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers'
import { getTranslations } from '@/lib/i18n/server'
import { revalidateProfile } from '@/app/actions/_helpers'
import type { MediaType } from '@/types/tmdb'
import type { Playlist } from '@/types/profile'

/**
 * Returns all playlists for a given user, with their items, newest first.
 *
 * @param userId - Supabase user ID.
 * @returns Array of Playlist objects with nested items.
 */
export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
    const { supabase } = await getAuthenticatedUser()

    const { data, error } = await supabase
        .from('playlists')
        .select('*, items:playlist_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) throw new Error(error.message)
    return (data as Playlist[]) ?? []
}

/**
 * Creates a new playlist for the authenticated user.
 *
 * @param name - Playlist name (1–100 chars).
 * @param description - Optional description (max 500 chars).
 */
export async function createPlaylist(name: string, description: string | null): Promise<void> {
    const t = await getTranslations()
    if (!name.trim() || name.length > 100) throw new Error(t.profile.errors.playlistNameInvalid)
    if (description && description.length > 500) throw new Error(t.profile.errors.descriptionTooLong)

    const { supabase, userId } = await getAuthenticatedUser()

    const { error } = await supabase.from('playlists').insert({ user_id: userId, name, description })

    if (error) throw new Error(error.message)
    await revalidateProfile(supabase)
}

/**
 * Updates a playlist's name and description.
 *
 * @param playlistId - UUID of the playlist.
 * @param name - New name (1–100 chars).
 * @param description - New description (max 500 chars), or null.
 */
export async function updatePlaylist(playlistId: string, name: string, description: string | null): Promise<void> {
    const t = await getTranslations()
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length > 100) throw new Error(t.profile.errors.playlistNameInvalid)
    if (description && description.length > 500) throw new Error(t.profile.errors.descriptionTooLong)

    const { supabase, userId } = await getAuthenticatedUser()

    const { error } = await supabase
        .from('playlists')
        .update({ name: trimmedName, description: description?.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', playlistId)
        .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await revalidateProfile(supabase)
}

/**
 * Deletes a playlist owned by the authenticated user.
 *
 * @param playlistId - UUID of the playlist.
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser()

    const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', userId)

    if (error) throw new Error(error.message)
    await revalidateProfile(supabase)
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
    const t = await getTranslations()
    const { supabase, userId } = await getAuthenticatedUser()

    const { data: playlist } = await supabase
        .from('playlists')
        .select('user_id')
        .eq('id', playlistId)
        .single()

    if (!playlist || playlist.user_id !== userId) throw new Error(t.profile.errors.playlistNotFound)

    const { error } = await supabase
        .from('playlist_items')
        .upsert(
            { playlist_id: playlistId, media_id: mediaId, media_type: mediaType, media_title: mediaTitle, poster_path: posterPath },
            { onConflict: 'playlist_id,media_id,media_type' }
        )

    if (error) throw new Error(error.message)
    await revalidateProfile(supabase)
}

/**
 * Removes a media item from a playlist owned by the authenticated user.
 *
 * @param playlistId - UUID of the playlist.
 * @param mediaId - TMDB media ID.
 * @param mediaType - 'movie' or 'tv'.
 */
export async function removeFromPlaylist(playlistId: string, mediaId: number, mediaType: MediaType): Promise<void> {
    const t = await getTranslations()
    const { supabase, userId } = await getAuthenticatedUser()

    const { data: playlist } = await supabase
        .from('playlists')
        .select('user_id')
        .eq('id', playlistId)
        .single()

    if (!playlist || playlist.user_id !== userId) throw new Error(t.profile.errors.playlistNotFound)

    const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)

    if (error) throw new Error(error.message)
    await revalidateProfile(supabase)
}
