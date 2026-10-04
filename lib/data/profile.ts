import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { USER_PROFILE_COLUMNS, PRIVACY_COLUMNS } from '@/lib/supabase/columns';
import type {
	PrivacySettings,
	PrivacyDefaults,
	UserProfile,
} from '@/types/profile';
import { reportSwallowed } from '@/lib/report';

const ALL_PUBLIC: PrivacyDefaults = {
	watchlist_visibility: 'public',
	watched_visibility: 'public',
	reviews_visibility: 'public',
	playlists_visibility: 'public',
	friends_visibility: 'public',
};

const ALL_PRIVATE: PrivacyDefaults = {
	watchlist_visibility: 'private',
	watched_visibility: 'private',
	reviews_visibility: 'private',
	playlists_visibility: 'private',
	friends_visibility: 'private',
};

/**
 * Returns the public profile for a given username (case-insensitive), or null if not found.
 *
 * @param username - The profile's username slug.
 * @returns UserProfile or null.
 */
export async function getProfileByUsername(
	username: string
): Promise<UserProfile | null> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('user_profiles')
		.select(USER_PROFILE_COLUMNS)
		.ilike('username', username)
		.maybeSingle();
	if (error) reportSwallowed('profile:by-username', error);

	return data ?? null;
}

/**
 * Returns privacy settings for a given user: all public when they never saved any (the documented
 * default), all private when they cannot be read — a failed read must never open a section.
 *
 * @param userId - Supabase user ID.
 * @returns PrivacySettings object.
 */
export async function getPrivacySettings(
	userId: string
): Promise<PrivacySettings> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('privacy_settings')
		.select(PRIVACY_COLUMNS)
		.eq('user_id', userId)
		.maybeSingle();

	if (error) {
		reportSwallowed('profile:privacy', error);
		return { user_id: userId, ...ALL_PRIVATE };
	}
	return (data as PrivacySettings) ?? { user_id: userId, ...ALL_PUBLIC };
}
