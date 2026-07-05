'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { getServerLanguage, getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { validateUsername, validateRegion } from '@/lib/validators';

export async function completeOnboarding(
	prevState: unknown,
	formData: FormData
) {
	const t = await getTranslations();
	const { supabase, userId, user } = await getAuthenticatedUser();

	const username = validateUsername(formData.get('username'));
	const region = validateRegion(formData.get('region'));

	if (!username || !region) return { error: t.settings.missingFields };

	const { data: existing } = await supabase
		.from('user_profiles')
		.select('user_id')
		.ilike('username', username)
		.maybeSingle();

	if (existing && existing.user_id !== userId)
		return { error: t.settings.usernameTaken };

	const meta = user.user_metadata ?? {};
	const fullName =
		(typeof meta.full_name === 'string' && meta.full_name) ||
		(typeof meta.name === 'string' ? meta.name : username);

	const { error: metaError } = await supabase.auth.updateUser({
		data: { username, region, full_name: fullName },
	});
	if (metaError) return { error: metaError.message };

	const { error: profileError } = await supabase.from('user_profiles').upsert(
		{
			user_id: userId,
			username,
			full_name: fullName,
			onboarding_completed: true,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: 'user_id' }
	);
	if (profileError?.code === '23505')
		return { error: t.settings.usernameTaken };
	if (profileError) return { error: profileError.message };

	revalidatePath('/', 'layout');
	redirect(localizedHref(await getServerLanguage(), '/dashboard'));
}
