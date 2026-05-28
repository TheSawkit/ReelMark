'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Verifies that the current request is authenticated.
 * Redirects to `/login` if no session is found.
 *
 * @returns The authenticated Supabase `User` object.
 */
export async function requireAuth(): Promise<User> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect('/login');

	return user;
}
