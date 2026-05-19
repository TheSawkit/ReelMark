'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { formStr } from '@/lib/validators'
import { getTranslations } from '@/lib/i18n/server'
import { revalidateProfile } from '@/app/actions/_helpers'
import type { PrivacySettings, PrivacyDefaults, PrivacyVisibility, UserProfile } from '@/types/profile'

const VALID_VISIBILITY = new Set<PrivacyVisibility>(['public', 'friends', 'private'])

function toVisibility(value: FormDataEntryValue | null): PrivacyVisibility {
    if (typeof value === 'string' && VALID_VISIBILITY.has(value as PrivacyVisibility)) {
        return value as PrivacyVisibility
    }
    return 'public'
}

/**
 * Returns the public profile for a given username (case-insensitive), or null if not found.
 *
 * @param username - The profile's username slug.
 * @returns UserProfile or null.
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('username', username)
        .single()

    return data ?? null
}

export async function updateSocialLinks(prevState: unknown, formData: FormData) {
    const { supabase, userId, user } = await getAuthenticatedUser()
    const t = await getTranslations()

    const username = user.user_metadata?.username as string | undefined

    if (!username) return { error: t.settings.social.errors.usernameRequired, success: false }

    const bio = formStr(formData, 'bio')
    const instagram = formStr(formData, 'instagram')
    const tiktok = formStr(formData, 'tiktok')
    const letterboxd = formStr(formData, 'letterboxd')
    const twitter = formStr(formData, 'twitter')
    const website = formStr(formData, 'website')

    if (bio && bio.length > 500) return { error: t.settings.social.errors.bioTooLong, success: false }
    if (instagram && instagram.length > 50) return { error: t.settings.social.errors.instagramTooLong, success: false }
    if (tiktok && tiktok.length > 50) return { error: t.settings.social.errors.tiktokTooLong, success: false }
    if (letterboxd && letterboxd.length > 50) return { error: t.settings.social.errors.letterboxdTooLong, success: false }
    if (twitter && twitter.length > 50) return { error: t.settings.social.errors.twitterTooLong, success: false }
    if (website) {
        if (!/^https?:\/\//.test(website)) return { error: t.settings.social.errors.websiteInvalid, success: false }
        if (website.length > 2000) return { error: t.settings.social.errors.websiteTooLong, success: false }
    }

    const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: userId, username, bio, instagram, tiktok, letterboxd, twitter, website, updated_at: new Date().toISOString() })

    if (error) return { error: error.message, success: false }

    revalidatePath(`/profile/${username}`)
    return { error: undefined, success: true, message: t.settings.social.title + t.settings.successUpdate }
}

/**
 * Returns privacy settings for a given user, falling back to all-public defaults.
 *
 * @param userId - Supabase user ID.
 * @returns PrivacySettings object.
 */
export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

    const fallback: PrivacyDefaults = {
        watchlist_visibility: 'public',
        watched_visibility: 'public',
        reviews_visibility: 'public',
        playlists_visibility: 'public',
        friends_visibility: 'public',
    }
    return (data as PrivacySettings) ?? { user_id: userId, ...fallback }
}

export async function updatePrivacySettings(prevState: unknown, formData: FormData) {
    const t = await getTranslations()
    const { supabase, userId } = await getAuthenticatedUser()

    const settings = {
        user_id: userId,
        watchlist_visibility: toVisibility(formData.get('watchlist_visibility')),
        watched_visibility: toVisibility(formData.get('watched_visibility')),
        reviews_visibility: toVisibility(formData.get('reviews_visibility')),
        playlists_visibility: toVisibility(formData.get('playlists_visibility')),
        friends_visibility: toVisibility(formData.get('friends_visibility')),
    }

    const { error } = await supabase.from('privacy_settings').upsert(settings)

    if (error) return { error: error.message, success: false }

    await revalidateProfile(supabase)
    return { error: undefined, success: true, message: t.settings.privacy.title + t.settings.successUpdate }
}
