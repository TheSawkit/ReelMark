import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { needsOnboarding } from '@/lib/onboarding';
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
	};
}

function createSupabaseResponse(
	request: NextRequest,
	requestHeaders: Headers
): NextResponse {
	return NextResponse.next({
		request: { headers: requestHeaders },
	});
}

/**
 * Whether the user still has to finish onboarding. Complete metadata answers without touching
 * the database, so the `onboarding_completed` lookup only runs for users mid-signup.
 */
async function hasIncompleteOnboarding(
	supabase: ReturnType<typeof createServerClient>,
	user: User
): Promise<boolean> {
	if (!needsOnboarding(user.user_metadata, false)) return false;

	const { data } = await supabase
		.from('user_profiles')
		.select('onboarding_completed')
		.eq('user_id', user.id)
		.maybeSingle();

	return needsOnboarding(user.user_metadata, data?.onboarding_completed);
}

/** Refreshes the Supabase session and enforces the redirect rules of protected, auth and recovery routes. */
export async function handleAuthRouting(
	request: NextRequest,
	locale: Language,
	requestHeaders: Headers,
	access: RouteAccess
): Promise<NextResponse> {
	const response = createSupabaseResponse(request, requestHeaders);

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						request.cookies.set(name, value);
						response.cookies.set(name, value, options);
					});
				},
			},
		}
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (access.isProtected && !user) {
		const loginUrl = request.nextUrl.clone();
		loginUrl.pathname = `/${locale}/login`;
		return NextResponse.redirect(loginUrl);
	}

	if (access.isRecovery && !user) {
		const errorUrl = request.nextUrl.clone();
		errorUrl.pathname = `/${locale}/auth/auth-code-error`;
		return NextResponse.redirect(errorUrl);
	}

	if (access.isAuthRoute && user) {
		const dashboardUrl = request.nextUrl.clone();
		dashboardUrl.pathname = `/${locale}/dashboard`;
		return NextResponse.redirect(dashboardUrl);
	}

	if (access.isProtected && user && !access.isOnboarding) {
		const incomplete = await hasIncompleteOnboarding(supabase, user);
		if (incomplete) {
			const onboardingUrl = request.nextUrl.clone();
			onboardingUrl.pathname = `/${locale}${ONBOARDING_SEGMENT}`;
			return NextResponse.redirect(onboardingUrl);
		}
	}

	return response;
}
