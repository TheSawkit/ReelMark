'use server';

import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/supabase/auth-helpers';
import type { User } from '@supabase/supabase-js';

/**
 * Verifies that the current request is authenticated.
 * Redirects to `/login` if no session is found.
 *
 * @returns The authenticated Supabase `User` object.
 */
export async function requireAuth(): Promise<User> {
	const { user } = await getUserContext();

	if (!user) redirect('/login');

	return user;
}
