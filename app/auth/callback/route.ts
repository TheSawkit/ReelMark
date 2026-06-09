import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectPath } from '@/lib/validators';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { BASE_URL } from '@/lib/metadata';

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get('code');
	const next = sanitizeRedirectPath(searchParams.get('next'), '/dashboard');
	const baseUrl = process.env.NODE_ENV === 'development' ? origin : BASE_URL;
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

		console.error('[auth/callback] Code exchange failed:', error?.message);
		return NextResponse.redirect(errorUrl);
	}

	return NextResponse.redirect(errorUrl);
}
