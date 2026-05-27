import { revalidatePath } from 'next/cache'
import type { createClient } from '@/lib/supabase/server'

export const SHARED_REVALIDATE_PATHS = ['/library', '/dashboard'] as const

export async function revalidateProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    const username = user?.user_metadata?.username as string | undefined
    if (username) revalidatePath(`/profile/${username}`)
}
