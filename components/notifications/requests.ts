'use client';

import { getNotifications, getUnreadCount } from '@/app/actions/notifications';
import { isRedirectSignal } from '@/lib/action-errors';
import { coalesceInFlight } from '@/lib/in-flight-guard';
import { reportSwallowed } from '@/lib/report';
import { notificationsStore } from '@/lib/stores/notifications';
import type { AppNotification } from '@/types/notifications';

const PANEL_SIZE = 8;

/** Re-reads the unread count from the server, which corrects any local estimate: another device, a new notification, a failed write. */
export const refreshUnreadCount = coalesceInFlight(async () => {
	const readFor = notificationsStore.owner();
	try {
		notificationsStore.setUnreadCount(await getUnreadCount(), readFor);
	} catch (error) {
		if (!isRedirectSignal(error))
			reportSwallowed('notifications:refresh', error);
	}
});

/** Starts loading the bell panel's notifications; called when the bell opens, so the request never runs from an effect. */
export function loadPanelNotifications(): Promise<AppNotification[]> {
	return getNotifications(PANEL_SIZE).catch((error) => {
		if (!isRedirectSignal(error))
			reportSwallowed('notifications:panel', error);
		return [];
	});
}
