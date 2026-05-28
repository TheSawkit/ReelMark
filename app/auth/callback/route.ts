import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectPath } from '@/lib/validators';
import { BASE_URL } from '@/lib/metadata';

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get('code');
	const next = sanitizeRedirectPath(searchParams.get('next'), '/dashboard');
	const baseUrl = process.env.NODE_ENV === 'development' ? origin : BASE_URL;

	if (code) {
		const supabase = await createClient();
		const { data, error } =
			await supabase.auth.exchangeCodeForSession(code);

		if (!error && data.session) {
			return NextResponse.redirect(`${baseUrl}${next}`);
		}

		console.error('[auth/callback] Code exchange failed:', error?.message);
		return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
	}

	return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}
