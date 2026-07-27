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
	markAllRead: () => Promise<void>;
	decrement: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
	unreadCount: 0,
	refresh: async () => {},
	markAllRead: async () => {},
	decrement: () => {},
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
		setUnreadCount(await getUnreadCount());
	}, []);

	const markAllRead = useCallback(async () => {
		setUnreadCount(0);
		await markAllNotificationsRead();
	}, []);

	const decrement = useCallback(() => {
		setUnreadCount((c) => Math.max(0, c - 1));
	}, []);

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
									setUnreadCount((c) => Math.max(0, c - 1));
									void markNotificationRead(n.id).catch(
										(error) =>
											reportSwallowed(
												'notifications:markRead',
												error
											)
									);
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
			.subscribe();

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
			value={{ unreadCount, refresh, markAllRead, decrement }}
		>
			{children}
		</NotificationsContext.Provider>
	);
}

/** Access notification badge state and actions. Must be inside NotificationsProvider. */
export function useNotifications() {
	return useContext(NotificationsContext);
}
