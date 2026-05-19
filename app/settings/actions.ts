'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getTranslations } from '@/lib/i18n/server'
import { validateEmail, validatePassword, validateUsername, validateRegion, validateAvatarFile, formStr } from '@/lib/validators'

async function syncUserProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, username: string): Promise<string | null> {
    const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: userId, username, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        .select('username')

    if (error?.code === '23505') return 'USERNAME_TAKEN'
    if (error) return error.message
    return null
}

export async function updateEmail(prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const t = await getTranslations()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: t.auth.notAuthenticated, success: false }
    }

    const newEmail = validateEmail(formData.get('email'))

    if (!newEmail) {
        return { error: t.settings.profile.newEmail, success: false }
    }

    const { error } = await supabase.auth.updateUser({
        email: newEmail,
    })

    if (error) {
        return { error: error.message, success: false }
    }

    return { error: undefined, success: true, message: t.settings.profile.confirmNewEmail }
}

export async function updatePassword(prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const t = await getTranslations()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: t.auth.notAuthenticated, success: false }
    }

    const newPassword = validatePassword(formData.get('password'))
    const confirmPassword = formData.get('confirm-password')

    if (!newPassword || !confirmPassword) {
        return { error: t.settings.missingFields, success: false }
    }

    if (newPassword !== confirmPassword) {
        return { error: t.settings.password.noMatch, success: false }
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        return { error: error.message, success: false }
    }

    return { error: undefined, success: true, message: `${t.settings.password.title}${t.settings.successUpdate}` }
}

export async function updateProfile(prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const t = await getTranslations()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: t.auth.notAuthenticated, success: false }
    }

    const fullName = validateUsername(formData.get('fullName'))
    const username = validateUsername(formData.get('username'))
    const region = validateRegion(formData.get('region'))

    if (!username) {
        return { error: t.settings.missingFields, success: false }
    }

    const { error } = await supabase.auth.updateUser({
        data: {
            full_name: fullName ?? null,
            name: fullName ?? username,
            username,
            region: region ?? undefined,
        },
    })

    if (error) {
        return { error: error.message, success: false }
    }

    const syncError = await syncUserProfile(supabase, user.id, username)
    if (syncError === 'USERNAME_TAKEN') return { error: t.settings.usernameTaken, success: false }
    if (syncError) return { error: syncError, success: false }

    revalidatePath('/', 'layout')
    return { error: undefined, success: true, message: `${t.settings.profile.title}${t.settings.successUpdate}` }
}

export async function updateAvatar(prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const t = await getTranslations()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: t.auth.notAuthenticated, success: false }
    }

    const avatarUrl = formStr(formData, 'avatarUrl')
    const avatarFile = formData.get('avatarFile') as File | null

    if (!avatarUrl && (!avatarFile || avatarFile.size === 0)) {
        return { error: t.settings.profile.invalidAvatarUrl, success: false }
    }

    let finalAvatarUrl = avatarUrl || ''

    if (avatarFile && avatarFile.size > 0) {
        const validation = validateAvatarFile(avatarFile)
        if (!validation.valid) {
            return { error: t.settings.avatar[validation.errorCode], success: false }
        }

        const fileExt = validation.ext
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const buffer = await avatarFile.arrayBuffer()

        const oldAvatarUrl = user.user_metadata?.avatar_url as string | undefined
        if (oldAvatarUrl?.includes('/avatars/')) {
            const oldPath = oldAvatarUrl.split('/avatars/')[1]?.split('?')[0]
            if (oldPath) {
                await supabase.storage.from('avatars').remove([oldPath])
            }
        }

        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, buffer, {
            contentType: avatarFile.type,
            upsert: true
        })

        if (uploadError) {
            return { error: uploadError.message, success: false }
        }

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`
    }

    const { error } = await supabase.auth.updateUser({
        data: {
            avatar_url: finalAvatarUrl,
            picture: finalAvatarUrl,
        },
    })

    if (error) {
        return { error: error.message, success: false }
    }

    revalidatePath('/', 'layout')
    return { error: undefined, success: true, message: `${t.settings.profile.avatar}${t.settings.successUpdate}` }
}

export async function deleteAccount(prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const t = await getTranslations()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: t.auth.notAuthenticated, success: false }
    }

    const confirmation = formData.get('confirmation')
    const password = formData.get('password')

    if (typeof confirmation !== 'string' || confirmation !== 'DELETE') {
        return { error: t.settings.dangerZone.incorrectConfirmation, success: false }
    }

    if (typeof password !== 'string' || !password) {
        return { error: t.settings.dangerZone.confirmPassword, success: false }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
    })

    if (signInError) {
        return { error: t.settings.dangerZone.confirmPassword, success: false }
    }

    await supabase.from('episode_watches').delete().eq('user_id', user.id)
    await supabase.from('watchlist').delete().eq('user_id', user.id)
    await supabase.from('reviews').delete().eq('user_id', user.id)

    const { data: userPlaylists } = await supabase.from('playlists').select('id').eq('user_id', user.id)
    if (userPlaylists && userPlaylists.length > 0) {
        await supabase.from('playlist_items').delete().in('playlist_id', userPlaylists.map(p => p.id))
    }
    await supabase.from('playlists').delete().eq('user_id', user.id)
    await supabase.from('friendships').delete().or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    await supabase.from('privacy_settings').delete().eq('user_id', user.id)
    await supabase.from('user_profiles').delete().eq('user_id', user.id)

    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
        return { error: deleteError.message, success: false }
    }

    revalidatePath('/', 'layout')
    redirect('/login?deleted=true')
}
