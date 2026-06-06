'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import {
	getNotifications,
	markNotificationRead,
	deleteNotification,
} from '@/app/actions/notifications';
import { useTranslation } from '@/lib/i18n/context';
import type { AppNotification } from '@/types/notifications';

interface NotificationPanelProps {
	onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
	const { t } = useTranslation();
	const { markAllRead, decrement } = useNotifications();
	const [items, setItems] = useState<AppNotification[] | null>(null);

	useEffect(() => {
		void getNotifications(8).then(setItems);
	}, []);

	const handleClick = (n: AppNotification) => {
		if (!n.readAt) {
			decrement();
			void markNotificationRead(n.id);
		}
		onClose();
	};

	const handleDelete = (id: string) => {
		setItems((prev) => prev?.filter((n) => n.id !== id) ?? null);
		void deleteNotification(id);
	};

	return (
		<div className="w-80 max-w-[calc(100vw-2rem)] p-2">
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="font-display text-lg text-text">
					{t.notifications.title}
				</span>
				<button
					onClick={() => void markAllRead()}
					className="flex cursor-pointer items-center gap-1 text-xs text-muted transition-colors hover:text-text"
				>
					<CheckCheck className="h-3.5 w-3.5" />
					{t.notifications.markAllRead}
				</button>
			</div>

			<div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
				{items && items.length === 0 && (
					<EmptyState icon={Bell} message={t.notifications.empty} />
				)}
				{items?.map((n) => (
					<NotificationItem
						key={n.id}
						notification={n}
						onClick={handleClick}
						onDelete={handleDelete}
					/>
				))}
			</div>

			<Link
				href="/notifications"
				onClick={onClose}
				className="mt-1 block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-surface-2"
			>
				{t.notifications.seeAll}
			</Link>
		</div>
	);
}
