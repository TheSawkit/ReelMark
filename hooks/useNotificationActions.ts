'use client';

import {
	deleteNotification,
	markAllNotificationsRead,
	markNotificationRead,
} from '@/app/actions/notifications';
import { refreshUnreadCount } from '@/components/notifications/requests';
import { isRedirectSignal } from '@/lib/action-errors';
import { toastActionError } from '@/lib/action-toast';
import { useTranslation } from '@/lib/i18n/context';
import { reportSwallowed } from '@/lib/report';
import { notificationsStore } from '@/lib/stores/notifications';
import type { AppNotification, OptimisticChange } from '@/types/notifications';

/** The notification writes shared by the bell panel and the notifications page: instant in every list and on the badge, undone with a toast when the server refuses them. A delete re-reads the count itself, since Supabase never delivers a filtered realtime DELETE. */
export function useNotificationActions() {
	const { t } = useTranslation();

	async function settle(
		label: string,
		change: OptimisticChange | null,
		write: () => Promise<void>,
		resyncAfterSuccess = false
	) {
		if (!change) return;
		try {
			await write();
			change.confirm?.();
			if (resyncAfterSuccess) void refreshUnreadCount();
		} catch (error) {
			change.undo();
			toastActionError(error, t.common.actionError);
			if (isRedirectSignal(error)) return;
			reportSwallowed(label, error);
			void refreshUnreadCount();
		}
	}

	function markRead(notification: AppNotification) {
		if (notification.readAt) return;
		void settle(
			'notifications:markRead',
			notificationsStore.markSeen(notification.id),
			() => markNotificationRead(notification.id)
		);
	}

	function remove(notification: AppNotification) {
		void settle(
			'notifications:delete',
			notificationsStore.remove(notification.id, !notification.readAt),
			() => deleteNotification(notification.id),
			true
		);
	}

	function markAllRead() {
		void settle(
			'notifications:markAllRead',
			notificationsStore.markAllSeen(),
			markAllNotificationsRead
		);
	}

	return { markRead, remove, markAllRead };
}
