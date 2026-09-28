import 'server-only';

import {
	getUserContext,
	redirectToLogin,
	type SessionUser,
} from '@/lib/supabase/auth-helpers';

/**
 * Verifies that the current request is authenticated.
 * Redirects to login, with a way back, if no session is found.
 *
 * @returns The signed-in user, as the verified access token describes it.
 */
export async function requireAuth(): Promise<SessionUser> {
	const { user } = await getUserContext();

	if (!user) return redirectToLogin();

	return user;
}
