import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectPath } from '@/lib/validators';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get('token_hash');
	const type = searchParams.get('type') as EmailOtpType | null;
	const next = sanitizeRedirectPath(searchParams.get('next'), '/');
	const lang = await getServerLanguage();

	const redirectTo = request.nextUrl.clone();
	redirectTo.search = '';
	redirectTo.pathname = localizedHref(lang, next);

	const supabase = await createClient();

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});
		if (!error) return NextResponse.redirect(redirectTo);
		console.error('[auth/confirm] OTP verification failed:', error.message);
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (user) return NextResponse.redirect(redirectTo);

	redirectTo.pathname = localizedHref(lang, '/auth/auth-code-error');
	return NextResponse.redirect(redirectTo);
}
