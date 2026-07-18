import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, clientIpFrom } from '@/lib/rate-limiter';
import { DEFAULT_LANGUAGE, isLanguage } from '@/lib/i18n/config';
import type { Language } from '@/lib/i18n/translations';

const PROTECTED_SEGMENTS = ['/dashboard', '/library', '/settings'];
const AUTH_SEGMENTS = ['/login', '/signup'];
const RECOVERY_SEGMENT = '/auth/update-password';

const SEARCH_LIMIT = 30;
const SEARCH_WINDOW_MS = 60_000;

function detectLocale(request: NextRequest): Language {
	const cookie = request.cookies.get('preferred-language')?.value;
	if (isLanguage(cookie)) return cookie;

	const accept = request.headers.get('accept-language') ?? '';
	const primary = accept.split(',')[0]?.split('-')[0]?.toLowerCase();
	if (primary === 'fr') return 'fr';

	return DEFAULT_LANGUAGE;
}

function hasSessionCookie(request: NextRequest): boolean {
	return request.cookies
		.getAll()
		.some(
			(cookie) =>
				cookie.name.startsWith('sb-') &&
				cookie.name.includes('-auth-token')
		);
}

function isBypassedPath(pathname: string): boolean {
	return (
		pathname.startsWith('/api') ||
		pathname.startsWith('/auth') ||
		pathname === '/og'
	);
}

function buildRequestHeaders(request: NextRequest, locale: Language): Headers {
	const headers = new Headers(request.headers);
	headers.set('x-locale', locale);
	return headers;
}

function handleSearchRateLimit(request: NextRequest): NextResponse | null {
	if (request.nextUrl.pathname !== '/api/search') return null;

	const ip = clientIpFrom(request.headers);
	const rate = checkRateLimit(`search:${ip}`, SEARCH_LIMIT, SEARCH_WINDOW_MS);

	if (rate.allowed) return null;

	return NextResponse.json(
		{ error: 'Too many requests' },
		{
			status: 429,
			headers: {
				'Retry-After': String(
					Math.ceil((rate.resetAt - Date.now()) / 1000)
				),
				'X-RateLimit-Limit': String(SEARCH_LIMIT),
				'X-RateLimit-Remaining': '0',
			},
		}
	);
}

function handleLocaleRedirect(
	request: NextRequest,
	pathname: string
): NextResponse | null {
	const firstSegment = pathname.split('/')[1];

	if (isLanguage(firstSegment)) return null;

	const locale = detectLocale(request);
	const isRoot = pathname === '/';
	const url = request.nextUrl.clone();

	url.pathname =
		isRoot && hasSessionCookie(request)
			? `/${locale}/dashboard`
			: `/${locale}${isRoot ? '' : pathname}`;

	return NextResponse.redirect(url);
}

type RouteAccess = {
	pathWithoutLocale: string;
	isProtected: boolean;
	isAuthRoute: boolean;
	isRecovery: boolean;
};

function getRouteAccess(pathname: string, locale: Language): RouteAccess {
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

async function handleAuthRouting(
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

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const rateLimitResponse = handleSearchRateLimit(request);
	if (rateLimitResponse) return rateLimitResponse;

	if (isBypassedPath(pathname)) {
		return NextResponse.next();
	}

	const localeRedirect = handleLocaleRedirect(request, pathname);
	if (localeRedirect) return localeRedirect;

	const locale = pathname.split('/')[1] as Language;
	const access = getRouteAccess(pathname, locale);
	const requestHeaders = buildRequestHeaders(request, locale);

	if (!access.isProtected && !access.isAuthRoute && !access.isRecovery) {
		return NextResponse.next({ request: { headers: requestHeaders } });
	}

	return handleAuthRouting(request, locale, requestHeaders, access);
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
