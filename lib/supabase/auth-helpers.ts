import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getServerLanguage } from '@/lib/i18n/server';
import { loginHref } from '@/lib/login-href';
import {
	sessionUserFromClaims,
	type SessionUser,
} from '@/lib/supabase/session-user';

export { sessionUserFromClaims, type SessionUser };

/**
 * Resolves the Supabase client and signed-in user once per request.
 *
 * `getClaims()` verifies the access token locally against the project's asymmetric (ES256)
 * signing key, fetched from the JWKS endpoint and cached for 10 minutes per process. The former
 * `getUser()` sent every page render, proxy pass and Server Action to `/auth/v1/user`: 57 000
 * Auth calls a day for two active users, each one billed as egress and as an Auth log line.
 * An expired token is still refreshed on the way, exactly as before.
 */
export const getUserContext = cache(async () => {
	const supabase = await createClient();
	let user: SessionUser | null = null;
	try {
		const { data } = await supabase.auth.getClaims();
		user = sessionUserFromClaims(data?.claims);
	} catch {
		// Unverifiable token (JWKS unreachable, malformed cookie): treated as signed out,
		// like getUser() answering with an error.
	}

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
	redirect(loginHref(lang, headerList.get('x-url')));
}

/**
 * Returns a Supabase client, the authenticated user's ID, and the session user — the gate of
 * every account-only read and write. A signed-out caller is redirected to login (see
 * `redirectToLogin`) rather than handed a generic error.
 *
 * @returns Object containing the Supabase client, user UUID, and session user.
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

/**
 * The full user record from the Auth server — identities, dates, the freshest email. One
 * network call: reserve it for the settings screens and account operations that need it.
 */
export const getFullUser = cache(async (): Promise<User | null> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
});

/**
 * Re-issues the access token after `updateUser({ data })`. The claims `getUserContext` reads
 * come from the token, and Supabase only writes new metadata into it at the next refresh:
 * without this a renamed user, or a new region, would stay stale for up to an hour.
 */
export async function refreshSessionClaims(
	supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
	await supabase.auth.refreshSession();
}

/** True when the account has only third-party (OAuth) identities and no email/password identity. */
export function isOAuthOnly(user: User): boolean {
	const identities = user.identities ?? [];
	return (
		identities.length > 0 &&
		!identities.some((identity) => identity.provider === 'email')
	);
}
