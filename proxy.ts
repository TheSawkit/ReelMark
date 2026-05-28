import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit } from '@/lib/rate-limiter';

const PROTECTED_ROUTES = ['/dashboard', '/library', '/settings'];
const AUTH_ROUTES = ['/login', '/signup'];

const SEARCH_LIMIT = 30;
const SEARCH_WINDOW_MS = 60_000;

function getClientIp(req: NextRequest): string {
	return (
		req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
		req.headers.get('x-real-ip') ??
		'unknown'
	);
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname === '/api/search') {
		const ip = getClientIp(request);
		const rate = checkRateLimit(
			`search:${ip}`,
			SEARCH_LIMIT,
			SEARCH_WINDOW_MS
		);

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

	const isProtected = PROTECTED_ROUTES.some((route) =>
		pathname.startsWith(route)
	);
	const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

	if (!isProtected && !isAuthRoute) return NextResponse.next();

	const response = NextResponse.next({ request });

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
		loginUrl.pathname = '/login';
		return NextResponse.redirect(loginUrl);
	}

	if (isAuthRoute && user) {
		const dashboardUrl = request.nextUrl.clone();
		dashboardUrl.pathname = '/dashboard';
		return NextResponse.redirect(dashboardUrl);
	}

	return response;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/).*)'],
};
