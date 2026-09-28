import { revalidatePath, revalidateTag } from 'next/cache';
import { after } from 'next/server';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';
import type { SessionUser } from '@/lib/supabase/session-user';
import type { MediaType } from '@/types/tmdb';
import { REVIEW_INDEX_TAG } from '@/lib/data/review-index';
import type { createClient } from '@/lib/supabase/server';

export const SHARED_REVALIDATE_PATHS = ['/library', '/dashboard'] as const;

function revalidateLocalized(path: string) {
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

/** Refreshes the pages that show one title's library status, after the response. */
export function revalidateWatchlistPaths(
	mediaType: MediaType,
	mediaId: number
) {
	revalidateLocalizedAfterResponse([
		...SHARED_REVALIDATE_PATHS,
		`/${mediaType}/${mediaId}`,
	]);
}

/**
 * Deferred whole-layout revalidation, for mutations that change what the shell renders
 * (username, avatar). Synchronously it would ship the caller's full RSC payload back with
 * the mutation response — the exact cost `revalidateLocalizedAfterResponse` exists to avoid.
 */
export function revalidateLayoutAfterResponse() {
	after(() => revalidatePath('/', 'layout'));
}

/**
 * Drops the cached Open Graph metadata of a playlist after the response.
 * Without it a renamed — or newly private — playlist keeps advertising its old name for the
 * whole `cacheLife` of `getPublicPlaylistMeta`.
 */
export function revalidatePlaylistMetaAfterResponse(playlistId: string) {
	after(() => revalidateTag(`playlist-meta:${playlistId}`, 'hours'));
}

/**
 * Marks the index of reviewed titles stale after the response, so a first review on a title
 * reaches anonymous visitors of this pod on their next visit; the other pods pick it up
 * within the minute of the index's `cacheLife`. Signed-in viewers never read through it.
 */
export function revalidateReviewIndexAfterResponse() {
	after(() => revalidateTag(REVIEW_INDEX_TAG, 'max'));
}

/**
 * Revalidates the acting user's profile pages (and optionally another user's) after the
 * response — same reason as revalidateLocalizedAfterResponse. Pass the user from
 * getAuthenticatedUser so auth is not fetched twice.
 */
export function revalidateProfileAfterResponse(
	supabase: Awaited<ReturnType<typeof createClient>>,
	user: SessionUser,
	otherUserId?: string
) {
	after(() => revalidateProfile(supabase, user, otherUserId));
}

async function revalidateProfile(
	supabase: Awaited<ReturnType<typeof createClient>>,
	user: SessionUser,
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
