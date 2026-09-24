'use client';

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
	deleteNotification,
	getUnreadCount,
	markAllNotificationsRead,
	markNotificationRead,
} from '@/app/actions/notifications';
import { NotificationToast } from '@/components/notifications/NotificationToast';
import { resolveAvatarUrl } from '@/lib/avatar';
import { rowToAppNotification, notificationMessage } from '@/lib/notifications';
import { promptStore } from '@/lib/prompts/store';
import { reportSwallowed } from '@/lib/report';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import type { AppNotification } from '@/types/notifications';

interface NotificationsContextValue {
	unreadCount: number;
	refresh: () => Promise<void>;
	markRead: (notification: AppNotification) => void;
	remove: (notification: AppNotification) => void;
	markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
	unreadCount: 0,
	refresh: async () => {},
	markRead: () => {},
	remove: () => {},
	markAllRead: () => {},
});

interface ProviderProps {
	userId: string;
	initialUnreadCount: number;
	children: ReactNode;
}

type NotificationRow = Parameters<typeof rowToAppNotification>[0] & {
	sender_id?: string;
};

export function NotificationsProvider({
	userId,
	initialUnreadCount,
	children,
}: ProviderProps) {
	const { t, lang } = useTranslation();
	const router = useRouter();
	const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

	const refresh = useCallback(async () => {
		try {
			setUnreadCount(await getUnreadCount());
		} catch (error) {
			reportSwallowed('notifications:refresh', error);
		}
	}, []);

	const settle = useCallback(
		(label: string, action: Promise<void>) => {
			void action.catch((error) => {
				reportSwallowed(label, error);
				void refresh();
			});
		},
		[refresh]
	);

	const markRead = useCallback(
		(notification: AppNotification) => {
			if (notification.readAt) return;
			setUnreadCount((c) => Math.max(0, c - 1));
			settle(
				'notifications:markRead',
				markNotificationRead(notification.id)
			);
		},
		[settle]
	);

	const remove = useCallback(
		(notification: AppNotification) => {
			if (!notification.readAt) setUnreadCount((c) => Math.max(0, c - 1));
			settle('notifications:delete', deleteNotification(notification.id));
		},
		[settle]
	);

	const markAllRead = useCallback(() => {
		setUnreadCount(0);
		settle('notifications:markAllRead', markAllNotificationsRead());
	}, [settle]);

	useEffect(() => {
		if (!('setAppBadge' in navigator)) return;
		const badge =
			unreadCount > 0
				? navigator.setAppBadge(unreadCount)
				: navigator.clearAppBadge();
		void badge.catch((error) =>
			reportSwallowed('notifications:appBadge', error)
		);
	}, [unreadCount]);

	useEffect(() => {
		function resyncWhenVisible() {
			if (document.visibilityState === 'visible') void refresh();
		}
		document.addEventListener('visibilitychange', resyncWhenVisible);
		return () =>
			document.removeEventListener('visibilitychange', resyncWhenVisible);
	}, [refresh]);

	useEffect(() => {
		const supabase = createClient();

		function showToast(n: AppNotification) {
			const url = n.url;
			toast.custom((id) => (
				<NotificationToast
					notification={n}
					message={notificationMessage(n, t.notifications.templates)}
					openLabel={t.notifications.open}
					onOpen={
						url
							? () => {
									toast.dismiss(id);
									router.push(localizedHref(lang, url));
								}
							: undefined
					}
				/>
			));
		}

		/**
		 * The realtime payload carries `sender_id`, never the picture, so the avatar costs one
		 * extra read — spent only on the notifications that actually show a face.
		 */
		async function resolveSenderAvatar(
			row: NotificationRow
		): Promise<string | null> {
			if (!row.type.startsWith('friend') || !row.sender_id) return null;
			const { data } = await supabase
				.from('user_profiles')
				.select('avatar_url')
				.eq('user_id', row.sender_id)
				.maybeSingle();
			return resolveAvatarUrl(data?.avatar_url, null);
		}

		let hasJoinedOnce = false;
		const channel = supabase
			.channel(`notifications:${userId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					setUnreadCount((c) => c + 1);
					const row = payload.new as NotificationRow;
					if (row.type === 'friend_request')
						promptStore.requestPush();

					void resolveSenderAvatar(row)
						.catch((error) => {
							reportSwallowed(
								'notifications:senderAvatar',
								error
							);
							return null;
						})
						.then((avatarUrl) =>
							showToast(rowToAppNotification(row, avatarUrl))
						);
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${userId}`,
				},
				() => void refresh()
			)
			.on(
				'postgres_changes',
				{
					event: 'DELETE',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${userId}`,
				},
				() => void refresh()
			)
			.subscribe((status) => {
				if (status !== 'SUBSCRIBED') return;
				if (hasJoinedOnce) void refresh();
				hasJoinedOnce = true;
			});

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [
		userId,
		refresh,
		router,
		lang,
		t.notifications.templates,
		t.notifications.open,
	]);

	return (
		<NotificationsContext.Provider
			value={{ unreadCount, refresh, markRead, remove, markAllRead }}
		>
			{children}
		</NotificationsContext.Provider>
	);
}

/** Access notification badge state and actions. Must be inside NotificationsProvider. */
export function useNotifications() {
	return useContext(NotificationsContext);
}
