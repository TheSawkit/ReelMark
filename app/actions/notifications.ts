'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { rowToAppNotification } from '@/lib/notifications';
import {
	DEFAULT_NOTIFICATION_PREFERENCES,
	type AppNotification,
	type NotificationPreferences,
} from '@/types/notifications';

const NOTIFICATION_COLUMNS =
	'id, type, sender_username, media_id, media_type, media_title, poster_path, season_number, episode_number, url, read_at, created_at';

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
	return (data ?? []).map(rowToAppNotification);
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

export async function markNotificationRead(id: string): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('id', id)
		.eq('user_id', userId)
		.is('read_at', null);
	if (error) throw new Error(error.message);
	revalidatePath('/notifications');
}

export async function markAllNotificationsRead(): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('user_id', userId)
		.is('read_at', null);
	if (error) throw new Error(error.message);
	revalidatePath('/notifications');
}

export async function deleteNotification(id: string): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('notifications')
		.delete()
		.eq('id', id)
		.eq('user_id', userId);
	if (error) throw new Error(error.message);
	revalidatePath('/notifications');
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { data } = await supabase
		.from('notification_preferences')
		.select('friend_requests, friend_accepted, new_episodes, suggestions')
		.eq('user_id', userId)
		.maybeSingle();
	return data ?? DEFAULT_NOTIFICATION_PREFERENCES;
}

export async function updateNotificationPreferences(
	prefs: NotificationPreferences
): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('notification_preferences')
		.upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' });
	if (error) throw new Error(error.message);
	revalidatePath('/settings');
}
