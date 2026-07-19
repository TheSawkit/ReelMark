import { NextResponse, type NextRequest } from 'next/server';
import { handleSearchRateLimit } from '@/lib/proxy/search-rate-limit';
import { handleLocaleRedirect, buildRequestHeaders } from '@/lib/proxy/locale';
import { getRouteAccess, handleAuthRouting } from '@/lib/proxy/auth-routing';
import type { Language } from '@/lib/i18n/translations';

function isBypassedPath(pathname: string): boolean {
	return (
		pathname.startsWith('/api') ||
		pathname.startsWith('/auth') ||
		pathname === '/og'
	);
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
