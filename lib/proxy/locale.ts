import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LANGUAGE, isLanguage } from '@/lib/i18n/config';
import type { Language } from '@/lib/i18n/translations';

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

/** Redirects locale-less URLs to their localized form, sending logged-in visitors of / to the dashboard. */
export function handleLocaleRedirect(
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

/** Forwards the request headers with the resolved locale so server code can read x-locale. */
export function buildRequestHeaders(
	request: NextRequest,
	locale: Language
): Headers {
	const headers = new Headers(request.headers);
	headers.set('x-locale', locale);
	return headers;
}
