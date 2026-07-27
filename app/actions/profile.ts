'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { formStr } from '@/lib/validators';
import { getTranslations } from '@/lib/i18n/server';
import {
	revalidateProfileAfterResponse,
	revalidateLocalizedAfterResponse,
} from '@/app/actions/_helpers';
import { parseVisibility } from '@/lib/privacy';

export async function updateSocialLinks(
	prevState: unknown,
	formData: FormData
) {
	const { supabase, userId, user } = await getAuthenticatedUser();
	const t = await getTranslations();

	const username = user.user_metadata?.username as string | undefined;

	if (!username)
		return {
			error: t.settings.social.errors.usernameRequired,
			success: false,
		};

	const bio = formStr(formData, 'bio');
	const instagram = formStr(formData, 'instagram');
	const tiktok = formStr(formData, 'tiktok');
	const letterboxd = formStr(formData, 'letterboxd');
	const twitter = formStr(formData, 'twitter');
	const website = formStr(formData, 'website');

	if (bio && bio.length > 500)
		return { error: t.settings.social.errors.bioTooLong, success: false };
	if (instagram && instagram.length > 50)
		return {
			error: t.settings.social.errors.instagramTooLong,
			success: false,
		};
	if (tiktok && tiktok.length > 50)
		return {
			error: t.settings.social.errors.tiktokTooLong,
			success: false,
		};
	if (letterboxd && letterboxd.length > 50)
		return {
			error: t.settings.social.errors.letterboxdTooLong,
			success: false,
		};
	if (twitter && twitter.length > 50)
		return {
			error: t.settings.social.errors.twitterTooLong,
			success: false,
		};
	if (website) {
		if (!/^https?:\/\//.test(website))
			return {
				error: t.settings.social.errors.websiteInvalid,
				success: false,
			};
		if (website.length > 2000)
			return {
				error: t.settings.social.errors.websiteTooLong,
				success: false,
			};
	}

	const { error } = await supabase.from('user_profiles').upsert({
		user_id: userId,
		username,
		bio,
		instagram,
		tiktok,
		letterboxd,
		twitter,
		website,
		updated_at: new Date().toISOString(),
	});

	if (error) return { error: error.message, success: false };

	revalidateLocalizedAfterResponse([`/profile/${username}`]);
	return {
		error: undefined,
		success: true,
		message: t.settings.social.title + t.settings.successUpdate,
	};
}

export async function updatePrivacySettings(
	prevState: unknown,
	formData: FormData
) {
	const t = await getTranslations();
	const { supabase, userId, user } = await getAuthenticatedUser();

	const settings = {
		user_id: userId,
		watchlist_visibility: parseVisibility(
			formData.get('watchlist_visibility'),
			'public'
		),
		watched_visibility: parseVisibility(
			formData.get('watched_visibility'),
			'public'
		),
		reviews_visibility: parseVisibility(
			formData.get('reviews_visibility'),
			'public'
		),
		playlists_visibility: parseVisibility(
			formData.get('playlists_visibility'),
			'public'
		),
		friends_visibility: parseVisibility(
			formData.get('friends_visibility'),
			'public'
		),
	};

	const { error } = await supabase.from('privacy_settings').upsert(settings);

	if (error) return { error: error.message, success: false };

	revalidateProfileAfterResponse(supabase, user);
	return {
		error: undefined,
		success: true,
		message: t.settings.privacy.title + t.settings.successUpdate,
	};
}
