'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { withRealtimeClient } from '@/lib/supabase/lazy-client';
import { NotificationToast } from '@/components/notifications/NotificationToast';
import { refreshUnreadCount } from '@/components/notifications/requests';
import { resolveAvatarUrl } from '@/lib/avatar';
import { rowToAppNotification, notificationMessage } from '@/lib/notifications';
import { promptStore } from '@/lib/prompts/store';
import { reportSwallowed } from '@/lib/report';
import {
	notificationsStore,
	useUnreadNotifications,
} from '@/lib/stores/notifications';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import type { AppNotification } from '@/types/notifications';

interface NotificationsSyncProps {
	userId: string;
	initialUnreadCount: number;
}

type NotificationRow = Parameters<typeof rowToAppNotification>[0] & {
	sender_id?: string;
};

/** Keeps the unread count live (seed, app icon badge, resync on tab return, realtime) and toasts incoming notifications; renders nothing. */
export function NotificationsSync({
	userId,
	initialUnreadCount,
}: NotificationsSyncProps) {
	const { t, lang } = useTranslation();
	const router = useRouter();
	const unreadCount = useUnreadNotifications(initialUnreadCount, userId);

	useEffect(() => {
		notificationsStore.adopt(userId);
		notificationsStore.setUnreadCount(initialUnreadCount, userId);
	}, [userId, initialUnreadCount]);

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
			if (document.visibilityState === 'visible')
				void refreshUnreadCount();
		}
		document.addEventListener('visibilitychange', resyncWhenVisible);
		return () =>
			document.removeEventListener('visibilitychange', resyncWhenVisible);
	}, []);

	useEffect(
		() =>
			withRealtimeClient((supabase) => {
				function showToast(n: AppNotification) {
					const url = n.url;
					toast.custom((id) => (
						<NotificationToast
							notification={n}
							message={notificationMessage(
								n,
								t.notifications.templates
							)}
							openLabel={t.notifications.open}
							onOpen={
								url
									? () => {
											toast.dismiss(id);
											router.push(
												localizedHref(lang, url)
											);
										}
									: undefined
							}
						/>
					));
				}

				async function resolveSenderAvatar(
					row: NotificationRow
				): Promise<string | null> {
					if (!row.type.startsWith('friend') || !row.sender_id)
						return null;
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
							void refreshUnreadCount();
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
									showToast(
										rowToAppNotification(row, avatarUrl)
									)
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
						() => void refreshUnreadCount()
					)
					.subscribe((status) => {
						if (status !== 'SUBSCRIBED') return;
						if (hasJoinedOnce) void refreshUnreadCount();
						hasJoinedOnce = true;
					});

				return () => {
					void supabase.removeChannel(channel);
				};
			}),
		[userId, router, lang, t.notifications.templates, t.notifications.open]
	);

	return null;
}
