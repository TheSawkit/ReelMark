import { createClient } from '@/lib/supabase/server';

/**
 * Returns a Supabase client, the authenticated user's ID, and the full user object.
 * Throws an error if the request is unauthenticated.
 *
 * @returns Object containing the Supabase client, user UUID, and full User object.
 * @throws Error if no authenticated session is found.
 */
export async function getAuthenticatedUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthenticated');

    return { supabase, userId: user.id, user };
}

/**
 * Returns a Supabase client and the user's ID if authenticated, or null if not.
 * Does not throw — safe to call from public pages.
 *
 * @returns Object containing the Supabase client and the user's UUID or null.
 */
export async function getOptionalUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return { supabase, userId: user?.id ?? null };
}
