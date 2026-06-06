'use client';

import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import {
	markNotificationRead,
	deleteNotification,
} from '@/app/actions/notifications';
import { useTranslation } from '@/lib/i18n/context';
import type { AppNotification } from '@/types/notifications';

export function NotificationsList({ initial }: { initial: AppNotification[] }) {
	const { t } = useTranslation();
	const { markAllRead, decrement } = useNotifications();
	const [items, setItems] = useState(initial);

	const onClick = (n: AppNotification) => {
		if (!n.readAt) {
			decrement();
			void markNotificationRead(n.id);
			setItems((prev) =>
				prev.map((x) =>
					x.id === n.id
						? { ...x, readAt: new Date().toISOString() }
						: x
				)
			);
		}
	};

	const onDelete = (id: string) => {
		setItems((prev) => prev.filter((x) => x.id !== id));
		void deleteNotification(id);
	};

	const onMarkAll = () => {
		void markAllRead();
		setItems((prev) =>
			prev.map((x) => ({
				...x,
				readAt: x.readAt ?? new Date().toISOString(),
			}))
		);
	};

	if (items.length === 0)
		return <EmptyState message={t.notifications.empty} icon={Bell} />;

	return (
		<div>
			<div className="mb-2 flex justify-end">
				<button
					onClick={onMarkAll}
					className="flex items-center gap-1 text-sm text-muted hover:text-text transition-colors cursor-pointer"
				>
					<CheckCheck className="h-4 w-4" />
					{t.notifications.markAllRead}
				</button>
			</div>
			<div className="space-y-0.5">
				{items.map((n) => (
					<NotificationItem
						key={n.id}
						notification={n}
						onClick={onClick}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
}
