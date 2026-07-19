import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Language } from '@/lib/i18n/translations';

const PROTECTED_SEGMENTS = ['/dashboard', '/library', '/settings'];
const AUTH_SEGMENTS = ['/login', '/signup'];
const RECOVERY_SEGMENT = '/auth/update-password';

export type RouteAccess = {
	pathWithoutLocale: string;
	isProtected: boolean;
	isAuthRoute: boolean;
	isRecovery: boolean;
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

	return response;
}
