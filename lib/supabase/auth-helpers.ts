import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { sanitizeRedirectPath } from '@/lib/validators';

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
 * Sends a signed-out caller to the login page of their language, with the page they were on as
 * `next` so logging in brings them back. Works from Server Components, Server Actions (the client
 * router follows the redirect) and Route Handlers.
 */
export async function redirectToLogin(): Promise<never> {
	const [lang, headerList] = await Promise.all([
		getServerLanguage(),
		headers(),
	]);
	const next = sanitizeRedirectPath(headerList.get('x-url'), '');
	const query = next ? `?next=${encodeURIComponent(next)}` : '';
	redirect(`${localizedHref(lang, '/login')}${query}`);
}

/**
 * Returns a Supabase client, the authenticated user's ID, and the full user object — the gate
 * of every account-only read and write. A signed-out caller is redirected to login (see
 * `redirectToLogin`) rather than handed a generic error.
 *
 * @returns Object containing the Supabase client, user UUID, and full User object.
 */
export async function getAuthenticatedUser() {
	const { supabase, user } = await getUserContext();

	if (!user) return redirectToLogin();

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

/** True when the account has only third-party (OAuth) identities and no email/password identity. */
export function isOAuthOnly(user: User): boolean {
	const identities = user.identities ?? [];
	return (
		identities.length > 0 &&
		!identities.some((identity) => identity.provider === 'email')
	);
}
