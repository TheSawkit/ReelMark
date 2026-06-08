import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * Resolves the Supabase client and authenticated user once per request.
 * Memoized so concurrent callers (navbar, layout guard, page, actions) share a
 * single `auth.getUser()` validation instead of revalidating the token each time.
 */
export const getUserContext = cache(async () => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return { supabase, user };
});

/**
 * Returns a Supabase client, the authenticated user's ID, and the full user object.
 * Throws an error if the request is unauthenticated.
 *
 * @returns Object containing the Supabase client, user UUID, and full User object.
 * @throws Error if no authenticated session is found.
 */
export async function getAuthenticatedUser() {
	const { supabase, user } = await getUserContext();

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
	const { supabase, user } = await getUserContext();

	return { supabase, userId: user?.id ?? null };
}
