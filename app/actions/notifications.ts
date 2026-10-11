'use server';

import { revalidateLocalizedAfterResponse } from '@/lib/revalidate';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import {
	getNotifications as readNotifications,
	getUnreadCount as readUnreadCount,
	NOTIFICATIONS_PAGE_SIZE,
} from '@/lib/data/notifications';
import { validateLimit, validateUUID } from '@/lib/validators';
import type {
	AppNotification,
	NotificationPreferences,
} from '@/types/notifications';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

/** Lazy-loaded notification list for the dropdown panel, which only opens on demand. */
export async function getNotifications(limit = 30): Promise<AppNotification[]> {
	if (validateLimit(limit, NOTIFICATIONS_PAGE_SIZE) === null)
		throw new Error('Invalid notifications limit');
	return readNotifications(limit);
}

/** Badge count resynced by the client after a realtime update or delete. */
export async function getUnreadCount(): Promise<number> {
	return readUnreadCount();
}

export async function markNotificationRead(id: string): Promise<void> {
	if (validateUUID(id) === null) throw new Error('Invalid notification ID');
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('id', id)
		.eq('user_id', userId)
		.is('read_at', null);
	if (error) throw new Error(error.message);
	revalidateLocalizedAfterResponse(['/notifications']);
}

/** Marks every notification seen; the caller marks the rows it has listed, so nothing but the write travels. */
export async function markAllNotificationsRead(): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('user_id', userId)
		.is('read_at', null);
	if (error) throw new Error(error.message);
	revalidateLocalizedAfterResponse(['/notifications']);
}

export async function deleteNotification(id: string): Promise<void> {
	if (validateUUID(id) === null) throw new Error('Invalid notification ID');
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('notifications')
		.delete()
		.eq('id', id)
		.eq('user_id', userId);
	if (error) throw new Error(error.message);
	revalidateLocalizedAfterResponse(['/notifications']);
}

export async function updateNotificationPreferences(
	prefs: NotificationPreferences
): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('notification_preferences')
		.upsert(
			{ user_id: userId, ...prefs },
			{ onConflict: ON_CONFLICT.notificationPreferences }
		);
	if (error) throw new Error(error.message);
	revalidateLocalizedAfterResponse(['/settings']);
}
