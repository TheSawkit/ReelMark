'use client';

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
	getUnreadCount,
	markAllNotificationsRead,
} from '@/app/actions/notifications';
import { rowToAppNotification, notificationMessage } from '@/lib/notifications';
import { useTranslation } from '@/lib/i18n/context';

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

export function NotificationsProvider({
	userId,
	initialUnreadCount,
	children,
}: ProviderProps) {
	const { t } = useTranslation();
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
					const n = rowToAppNotification(
						payload.new as Parameters<
							typeof rowToAppNotification
						>[0]
					);
					toast(notificationMessage(n, t.notifications.templates));
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
	}, [userId, refresh, t.notifications.templates]);

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
