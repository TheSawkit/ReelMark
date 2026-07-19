import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, clientIpFrom } from '@/lib/rate-limiter';

const SEARCH_LIMIT = 30;
const SEARCH_WINDOW_MS = 60_000;

/** Returns a 429 response when the caller exceeded the /api/search budget, null otherwise. */
export function handleSearchRateLimit(
	request: NextRequest
): NextResponse | null {
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
