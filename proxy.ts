import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit } from '@/lib/rate-limiter';
import { DEFAULT_LANGUAGE, isLanguage } from '@/lib/i18n/config';
import type { Language } from '@/lib/i18n/translations';

const PROTECTED_SEGMENTS = ['/dashboard', '/library', '/settings'];
const AUTH_SEGMENTS = ['/login', '/signup'];

const SEARCH_LIMIT = 30;
const SEARCH_WINDOW_MS = 60_000;

function getClientIp(req: NextRequest): string {
	return (
		req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
		req.headers.get('x-real-ip') ??
		'unknown'
	);
}

function detectLocale(request: NextRequest): Language {
	const cookie = request.cookies.get('preferred-language')?.value;
	if (isLanguage(cookie)) return cookie;

	const accept = request.headers.get('accept-language') ?? '';
	const primary = accept.split(',')[0]?.split('-')[0]?.toLowerCase();
	if (primary === 'fr') return 'fr';

	return DEFAULT_LANGUAGE;
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname === '/api/search') {
		const ip = getClientIp(request);
		const rate = checkRateLimit(`search:${ip}`, SEARCH_LIMIT, SEARCH_WINDOW_MS);

		if (!rate.allowed) {
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
	}

	if (pathname.startsWith('/api') || pathname.startsWith('/auth')) {
		return NextResponse.next();
	}

	const firstSegment = pathname.split('/')[1];

	if (!isLanguage(firstSegment)) {
		const locale = detectLocale(request);
		const url = request.nextUrl.clone();
		url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
		return NextResponse.redirect(url);
	}

	const locale: Language = firstSegment;
	const pathWithoutLocale = pathname.slice(locale.length + 1) || '/';

	const isProtected = PROTECTED_SEGMENTS.some((segment) =>
		pathWithoutLocale.startsWith(segment)
	);
	const isAuthRoute = AUTH_SEGMENTS.some((segment) =>
		pathWithoutLocale.startsWith(segment)
	);

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-locale', locale);

	if (!isProtected && !isAuthRoute) {
		return NextResponse.next({ request: { headers: requestHeaders } });
	}

	const response = NextResponse.next({ request: { headers: requestHeaders } });

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

	if (isProtected && !user) {
		const loginUrl = request.nextUrl.clone();
		loginUrl.pathname = `/${locale}/login`;
		return NextResponse.redirect(loginUrl);
	}

	if (isAuthRoute && user) {
		const dashboardUrl = request.nextUrl.clone();
		dashboardUrl.pathname = `/${locale}/dashboard`;
		return NextResponse.redirect(dashboardUrl);
	}

	return response;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
