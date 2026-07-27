import 'server-only';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { resolveAvatarUrl } from '@/lib/avatar';
import { rowToAppNotification } from '@/lib/notifications';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
	DEFAULT_NOTIFICATION_PREFERENCES,
	type AppNotification,
	type NotificationPreferences,
} from '@/types/notifications';

const NOTIFICATION_COLUMNS =
	'id, type, sender_id, sender_username, media_id, media_type, media_title, poster_path, season_number, episode_number, url, read_at, created_at';

/**
 * Senders' avatars keyed by user id. Fetched separately rather than embedded: `sender_id` has
 * no declared foreign key to `user_profiles`, so PostgREST cannot join the two.
 */
async function getSenderAvatars(
	supabase: SupabaseClient,
	senderIds: string[]
): Promise<Map<string, string>> {
	if (senderIds.length === 0) return new Map();

	const { data } = await supabase
		.from('user_profiles')
		.select('user_id, avatar_url')
		.in('user_id', senderIds);

	const avatars = new Map<string, string>();
	for (const profile of data ?? []) {
		const url = resolveAvatarUrl(profile.avatar_url, null);
		if (url) avatars.set(profile.user_id, url);
	}
	return avatars;
}

/** Returns the authenticated user's notifications, newest first. */
export async function getNotifications(limit = 30): Promise<AppNotification[]> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { data, error } = await supabase
		.from('notifications')
		.select(NOTIFICATION_COLUMNS)
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(limit);
	if (error) throw new Error(error.message);

	const rows = data ?? [];
	const avatars = await getSenderAvatars(supabase, [
		...new Set(rows.map((row) => row.sender_id).filter(Boolean)),
	]);

	return rows.map((row) =>
		rowToAppNotification(row, avatars.get(row.sender_id) ?? null)
	);
}

/** Returns the count of unread notifications for the authenticated user. */
export async function getUnreadCount(): Promise<number> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { count, error } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.is('read_at', null);
	if (error) throw new Error(error.message);
	return count ?? 0;
}

/** Per-channel notification opt-ins, falling back to the all-on defaults. */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { data } = await supabase
		.from('notification_preferences')
		.select('friend_requests, friend_accepted, new_episodes, suggestions')
		.eq('user_id', userId)
		.maybeSingle();
	return data ?? DEFAULT_NOTIFICATION_PREFERENCES;
}
