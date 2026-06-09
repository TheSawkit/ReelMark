'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getServerLanguage, getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import {
	validateEmail,
	validatePassword,
	validateUsername,
	validateRegion,
	validateLanguage,
} from '@/lib/validators';

type AuthTranslations = Awaited<ReturnType<typeof getTranslations>>;

function mapAuthError(message: string, t: AuthTranslations): string {
	if (message.includes('Invalid login credentials'))
		return t.auth.errors.invalidCredentials;
	if (message.includes('Email not confirmed'))
		return t.auth.errors.emailNotConfirmed;
	if (
		message.includes('User already registered') ||
		message.includes('already been registered')
	)
		return t.auth.errors.emailAlreadyUsed;
	if (
		message.toLowerCase().includes('rate limit') ||
		message.toLowerCase().includes('too many requests')
	)
		return t.auth.errors.rateLimitExceeded;
	return message;
}

async function getOrigin(): Promise<string> {
	const h = await headers();
	const proto = h.get('x-forwarded-proto') ?? 'https';
	const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'reelmark-silexio.vercel.app';
	return `${proto}://${host}`;
}

export async function login(prevState: unknown, formData: FormData) {
	const t = await getTranslations();
	const email = validateEmail(formData.get('email'));
	const password = validatePassword(formData.get('password'));

	if (!email || !password) return { error: t.settings.missingFields };

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) return { error: mapAuthError(error.message, t) };

	revalidatePath('/', 'layout');
	redirect(localizedHref(await getServerLanguage(), '/dashboard'));
}

export async function signup(prevState: unknown, formData: FormData) {
	const t = await getTranslations();

	const email = validateEmail(formData.get('email'));
	const password = validatePassword(formData.get('password'));
	const confirmPassword = formData.get('confirm-password');
	const username = validateUsername(formData.get('username'));
	const region = validateRegion(formData.get('region'));
	const language = validateLanguage(formData.get('language'));

	if (!email || !password || !username || !region)
		return { error: t.settings.missingFields };
	if (password !== confirmPassword)
		return { error: t.settings.password.noMatch };

	const supabase = await createClient();

	const { data: existingProfile } = await supabase
		.from('user_profiles')
		.select('user_id')
		.ilike('username', username)
		.maybeSingle();

	if (existingProfile) return { error: t.settings.usernameTaken };

	const origin = await getOrigin();
	const { error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
			data: {
				full_name: username,
				username,
				region,
				language,
			},
		},
	});

	if (error) return { error: mapAuthError(error.message, t) };

	revalidatePath('/', 'layout');
	redirect(localizedHref(await getServerLanguage(), '/dashboard'));
}

export async function signout() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	revalidatePath('/', 'layout');
	redirect(localizedHref(await getServerLanguage(), '/login'));
}

export async function requestPasswordReset(
	prevState: unknown,
	formData: FormData
) {
	const t = await getTranslations();
	const email = validateEmail(formData.get('email'));
	if (!email) return { error: t.settings.missingFields };

	const supabase = await createClient();
	const origin = await getOrigin();
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${origin}/auth/confirm?next=/auth/update-password`,
	});

	if (error) return { error: error.message };

	return { error: '', success: true };
}

export async function updatePassword(prevState: unknown, formData: FormData) {
	const t = await getTranslations();
	const password = validatePassword(formData.get('password'));
	const confirmPassword = formData.get('confirm-password');
	if (!password) return { error: t.settings.missingFields };
	if (password !== confirmPassword)
		return { error: t.settings.password.noMatch };

	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({ password });
	if (error) return { error: error.message };

	revalidatePath('/', 'layout');
	redirect(localizedHref(await getServerLanguage(), '/dashboard'));
}
