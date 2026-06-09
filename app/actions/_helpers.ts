import { revalidatePath } from 'next/cache';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';
import type { createClient } from '@/lib/supabase/server';

export const SHARED_REVALIDATE_PATHS = ['/library', '/dashboard'] as const;

/** Revalidates a locale-agnostic app path across every supported language prefix (routes now live under /[lang]). */
export function revalidateLocalized(path: string) {
	for (const lang of SUPPORTED_LANGUAGES) revalidatePath(`/${lang}${path}`);
}

export async function revalidateProfile(
	supabase: Awaited<ReturnType<typeof createClient>>,
	otherUserId?: string
) {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const username = user?.user_metadata?.username as string | undefined;
	if (username) revalidateLocalized(`/profile/${username}`);

	if (otherUserId) {
		const { data } = await supabase
			.from('user_profiles')
			.select('username')
			.eq('user_id', otherUserId)
			.maybeSingle();
		if (data?.username) revalidateLocalized(`/profile/${data.username}`);
	}
}
