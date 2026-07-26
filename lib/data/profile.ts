import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { USER_PROFILE_COLUMNS, PRIVACY_COLUMNS } from '@/lib/supabase/columns';
import type {
	PrivacySettings,
	PrivacyDefaults,
	UserProfile,
} from '@/types/profile';

const ALL_PUBLIC: PrivacyDefaults = {
	watchlist_visibility: 'public',
	watched_visibility: 'public',
	reviews_visibility: 'public',
	playlists_visibility: 'public',
	friends_visibility: 'public',
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

	const { data } = await supabase
		.from('user_profiles')
		.select(USER_PROFILE_COLUMNS)
		.ilike('username', username)
		.maybeSingle();

	return data ?? null;
}

/**
 * Returns privacy settings for a given user, falling back to all-public defaults.
 *
 * @param userId - Supabase user ID.
 * @returns PrivacySettings object.
 */
export async function getPrivacySettings(
	userId: string
): Promise<PrivacySettings> {
	const supabase = await createClient();

	const { data } = await supabase
		.from('privacy_settings')
		.select(PRIVACY_COLUMNS)
		.eq('user_id', userId)
		.maybeSingle();

	return (data as PrivacySettings) ?? { user_id: userId, ...ALL_PUBLIC };
}
