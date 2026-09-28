import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
	sessionUserFromClaims,
	type SessionUser,
} from '@/lib/supabase/session-user';
import { needsOnboarding } from '@/lib/onboarding';
import { sanitizeRedirectPath } from '@/lib/validators';
import { localizedHref } from '@/lib/i18n/utils';
import { loginHref } from '@/lib/login-href';
import type { Language } from '@/lib/i18n/translations';

const PROTECTED_SEGMENTS = [
	'/dashboard',
	'/library',
	'/settings',
	'/explorer',
	'/profile',
	'/notifications',
	'/onboarding',
];
const AUTH_SEGMENTS = ['/login', '/signup'];
const RECOVERY_SEGMENT = '/auth/update-password';
const ONBOARDING_SEGMENT = '/onboarding';

export type RouteAccess = {
	pathWithoutLocale: string;
	isProtected: boolean;
	isAuthRoute: boolean;
	isRecovery: boolean;
	isOnboarding: boolean;
	isLanding: boolean;
};

/** Classifies a localized pathname against the protected, auth and recovery route lists. */
export function getRouteAccess(
	pathname: string,
	locale: Language
): RouteAccess {
	const pathWithoutLocale = pathname.slice(locale.length + 1) || '/';

	return {
		pathWithoutLocale,
		isProtected: PROTECTED_SEGMENTS.some((segment) =>
			pathWithoutLocale.startsWith(segment)
		),
		isAuthRoute: AUTH_SEGMENTS.some((segment) =>
			pathWithoutLocale.startsWith(segment)
		),
		isRecovery: pathWithoutLocale.startsWith(RECOVERY_SEGMENT),
		isOnboarding: pathWithoutLocale.startsWith(ONBOARDING_SEGMENT),
		isLanding: pathWithoutLocale === '/',
	};
}

type ProxySupabase = ReturnType<typeof createServerClient>;

/**
 * Supabase client bound to the proxy's request and response. A refreshed session is written both
 * ways: into the response cookies for the browser, and into the forwarded request so the Server
 * Components of this same request read the new tokens instead of refreshing a second time — they
 * cannot write cookies, and a rotated refresh token they drop gets the whole session revoked on
 * its next reuse (the "randomly signed out" failure).
 */
function createProxySupabase(request: NextRequest, requestHeaders: Headers) {
	let response = NextResponse.next({ request: { headers: requestHeaders } });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet, headers) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value)
					);
					requestHeaders.set(
						'cookie',
						request.headers.get('cookie') ?? ''
					);
					response = NextResponse.next({
						request: { headers: requestHeaders },
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options)
					);
					Object.entries(headers).forEach(([key, value]) =>
						response.headers.set(key, value)
					);
				},
			},
		}
	);

	/** Redirect that keeps whatever session cookies the client just wrote (refreshed or cleared). */
	const redirect = (url: URL) => {
		const redirected = NextResponse.redirect(url);
		response.cookies
			.getAll()
			.forEach((cookie) => redirected.cookies.set(cookie));
		return redirected;
	};

	return { supabase, response: () => response, redirect };
}

/**
 * Refreshes an expiring session on pages that do not need the user — the navbar still reads it,
 * and only the proxy can store the rotated tokens. `getSession` refreshes only when the token
 * has expired and never calls Auth otherwise; nothing here trusts its result, the Server
 * Components still verify the user themselves. (`getClaims` would add an Auth round trip per
 * page on projects still signing JWTs with the legacy symmetric secret.)
 */
export async function refreshSession(
	request: NextRequest,
	requestHeaders: Headers
): Promise<NextResponse> {
	const { supabase, response } = createProxySupabase(request, requestHeaders);
	await supabase.auth.getSession();
	return response();
}

/**
 * Whether the user still has to finish onboarding. Complete metadata answers without touching
 * the database, so the `onboarding_completed` lookup only runs for users mid-signup.
 */
async function hasIncompleteOnboarding(
	supabase: ProxySupabase,
	user: SessionUser
): Promise<boolean> {
	if (!needsOnboarding(user.user_metadata, false)) return false;

	const { data } = await supabase
		.from('user_profiles')
		.select('onboarding_completed')
		.eq('user_id', user.id)
		.maybeSingle();

	return needsOnboarding(user.user_metadata, data?.onboarding_completed);
}

/** Refreshes the Supabase session and enforces the redirect rules of protected, auth, recovery and landing routes — the landing sends a signed-in visitor straight to the dashboard with one HTTP redirect. */
export async function handleAuthRouting(
	request: NextRequest,
	locale: Language,
	requestHeaders: Headers,
	access: RouteAccess
): Promise<NextResponse> {
	const { supabase, response, redirect } = createProxySupabase(
		request,
		requestHeaders
	);

	// Verified locally against the cached JWKS (ES256 signing key) and refreshed when expired:
	// the proxy runs on every protected navigation and prefetch, and getUser() made each one
	// an Auth round-trip.
	let user: SessionUser | null = null;
	try {
		const { data } = await supabase.auth.getClaims();
		user = sessionUserFromClaims(data?.claims);
	} catch {
		// Unverifiable token: routed as signed out.
	}

	if (access.isProtected && !user) {
		const { pathname, search } = request.nextUrl;
		return redirect(
			new URL(loginHref(locale, `${pathname}${search}`), request.nextUrl)
		);
	}

	if (access.isRecovery && !user) {
		const errorUrl = request.nextUrl.clone();
		errorUrl.pathname = `/${locale}/auth/auth-code-error`;
		return redirect(errorUrl);
	}

	if ((access.isAuthRoute || access.isLanding) && user) {
		const next = sanitizeRedirectPath(
			request.nextUrl.searchParams.get('next'),
			'/dashboard'
		);
		return redirect(new URL(localizedHref(locale, next), request.nextUrl));
	}

	if (access.isProtected && user && !access.isOnboarding) {
		const incomplete = await hasIncompleteOnboarding(supabase, user);
		if (incomplete) {
			const onboardingUrl = request.nextUrl.clone();
			onboardingUrl.pathname = `/${locale}${ONBOARDING_SEGMENT}`;
			return redirect(onboardingUrl);
		}
	}

	return response();
}
