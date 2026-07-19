import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectPath } from '@/lib/validators';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { reportSwallowed } from '@/lib/report';

export async function GET(request: Request) {
	const { searchParams, origin, host } = new URL(request.url);
	const code = searchParams.get('code');
	const next = sanitizeRedirectPath(searchParams.get('next'), '/dashboard');
	const requestBaseUrl =
		request.headers.get('x-forwarded-proto') === 'https'
			? `https://${host}`
			: origin;
	const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
	const baseUrl = envBaseUrl?.startsWith('http')
		? envBaseUrl
		: requestBaseUrl;
	const lang = await getServerLanguage();
	const errorUrl = `${baseUrl}${localizedHref(lang, '/auth/auth-code-error')}`;

	if (code) {
		const supabase = await createClient();
		const { data, error } =
			await supabase.auth.exchangeCodeForSession(code);

		if (!error && data.session) {
			return NextResponse.redirect(
				`${baseUrl}${localizedHref(lang, next)}`
			);
		}

		reportSwallowed('auth/callback:code-exchange', error?.message);
		return NextResponse.redirect(errorUrl);
	}

	return NextResponse.redirect(errorUrl);
}
