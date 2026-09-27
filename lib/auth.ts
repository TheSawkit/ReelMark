import 'server-only';

import { getUserContext, redirectToLogin } from '@/lib/supabase/auth-helpers';
import type { User } from '@supabase/supabase-js';

/**
 * Verifies that the current request is authenticated.
 * Redirects to login, with a way back, if no session is found.
 *
 * @returns The authenticated Supabase `User` object.
 */
export async function requireAuth(): Promise<User> {
	const { user } = await getUserContext();

	if (!user) return redirectToLogin();

	return user;
}
