import { revalidatePath, revalidateTag } from 'next/cache';
import { after } from 'next/server';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';
import type { User } from '@supabase/supabase-js';
import type { createClient } from '@/lib/supabase/server';

export const SHARED_REVALIDATE_PATHS = ['/library', '/dashboard'] as const;

/** Revalidates a locale-agnostic app path across every supported language prefix (routes now live under /[lang]). */
export function revalidateLocalized(path: string) {
	for (const lang of SUPPORTED_LANGUAGES) revalidatePath(`/${lang}${path}`);
}

/**
 * Revalidates paths after the action response is sent.
 * Any revalidatePath call during an action forces Next to re-render the calling page and
 * ship its full RSC payload back, so deferring keeps mutation responses payload-free while
 * still refreshing the target routes for the next navigation.
 */
export function revalidateLocalizedAfterResponse(paths: readonly string[]) {
	after(() => {
		for (const path of paths) revalidateLocalized(path);
	});
}

/**
 * Drops the cached Open Graph metadata of a playlist after the response.
 * Without it a renamed — or newly private — playlist keeps advertising its old name for the
 * whole `cacheLife` of `getPublicPlaylistMeta`.
 */
export function revalidatePlaylistMetaAfterResponse(playlistId: string) {
	after(() => revalidateTag(`playlist-meta:${playlistId}`, 'hours'));
}

/** Deferred variant of revalidateProfile — same reason as revalidateLocalizedAfterResponse. */
export function revalidateProfileAfterResponse(
	supabase: Awaited<ReturnType<typeof createClient>>,
	user: User,
	otherUserId?: string
) {
	after(() => revalidateProfile(supabase, user, otherUserId));
}

/** Revalidates the acting user's profile pages (and optionally another user's) without re-fetching auth — pass the user from getAuthenticatedUser. */
export async function revalidateProfile(
	supabase: Awaited<ReturnType<typeof createClient>>,
	user: User,
	otherUserId?: string
) {
	const username = user.user_metadata?.username as string | undefined;
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
