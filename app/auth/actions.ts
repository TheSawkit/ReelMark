'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { BASE_URL } from '@/lib/metadata';
import { getServerLanguage, getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import {
	validateEmail,
	validatePassword,
	validateUsername,
	validateRegion,
	validateLanguage,
} from '@/lib/validators';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

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

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${BASE_URL}/auth/confirm?next=/dashboard`,
			data: {
				full_name: username,
				username,
				region,
				language,
			},
		},
	});

	if (error) return { error: mapAuthError(error.message, t) };

	const isNewUser = (data.user?.identities?.length ?? 0) > 0;
	if (data.user && isNewUser) {
		const { error: profileError } = await createAdminClient()
			.from('user_profiles')
			.upsert(
				{
					user_id: data.user.id,
					username,
					full_name: username,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: ON_CONFLICT.userProfiles }
			);

		if (profileError?.code === '23505')
			return { error: t.settings.usernameTaken };
		if (profileError) return { error: profileError.message };
	}

	revalidatePath('/', 'layout');
	redirect(localizedHref(await getServerLanguage(), '/dashboard'));
}

export async function signout() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	revalidatePath('/', 'layout');
	redirect(localizedHref(await getServerLanguage(), '/login'));
}

/**
 * Sends a passwordless sign-in link to an existing account.
 *
 * Never creates a user: signup must go through the form that collects the username
 * `handle_new_user` copies into the profile, so an OTP-created account would have none.
 *
 * @param email - Address to send the link to.
 * @returns Success even when no account matches, so the response can't be used to probe emails.
 */
export async function requestMagicLink(
	email: string
): Promise<{ error?: string; success?: boolean }> {
	const t = await getTranslations();
	const validEmail = validateEmail(email);
	if (!validEmail) return { error: t.settings.missingFields };

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithOtp({
		email: validEmail,
		options: {
			shouldCreateUser: false,
			emailRedirectTo: `${BASE_URL}/auth/confirm?next=/dashboard`,
		},
	});

	if (error) {
		if (error.message.toLowerCase().includes('signups not allowed')) {
			return { success: true };
		}
		return { error: mapAuthError(error.message, t) };
	}

	return { success: true };
}

export async function requestPasswordReset(
	prevState: unknown,
	formData: FormData
) {
	const t = await getTranslations();
	const email = validateEmail(formData.get('email'));
	if (!email) return { error: t.settings.missingFields };

	const supabase = await createClient();
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${BASE_URL}/auth/confirm?next=/auth/update-password`,
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
