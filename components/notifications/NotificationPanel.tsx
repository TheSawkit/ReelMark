'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import { getNotifications } from '@/app/actions/notifications';
import { reportSwallowed } from '@/lib/report';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import type { AppNotification } from '@/types/notifications';

interface NotificationPanelProps {
	onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
	const { t, lang } = useTranslation();
	const { markRead, remove, markAllRead } = useNotifications();
	const [items, setItems] = useState<AppNotification[] | null>(null);

	useEffect(() => {
		getNotifications(8)
			.then(setItems)
			.catch((error) => {
				reportSwallowed('notifications:panel', error);
				setItems([]);
			});
	}, []);

	const handleMarkRead = (n: AppNotification) => {
		markRead(n);
		setItems(
			(prev) =>
				prev?.map((x) =>
					x.id === n.id
						? { ...x, readAt: new Date().toISOString() }
						: x
				) ?? null
		);
	};

	const handleDelete = (n: AppNotification) => {
		remove(n);
		setItems((prev) => prev?.filter((x) => x.id !== n.id) ?? null);
	};

	const handleMarkAllRead = () => {
		markAllRead();
		setItems(
			(prev) =>
				prev?.map((x) => ({
					...x,
					readAt: x.readAt ?? new Date().toISOString(),
				})) ?? null
		);
	};

	return (
		<div className="w-80 max-w-[calc(100vw-2rem)] p-2">
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="heading-display leading-none text-lg text-text">
					{t.notifications.title}
				</span>
				<button
					onClick={handleMarkAllRead}
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
						onClick={onClose}
						onMarkRead={handleMarkRead}
						onDelete={handleDelete}
					/>
				))}
			</div>

			<Link
				href={localizedHref(lang, '/notifications')}
				onClick={onClose}
				className="mt-1 block rounded-lg px-3 py-2 text-center text-sm font-medium text-red-text transition-colors hover:bg-surface-2"
			>
				{t.notifications.seeAll}
			</Link>
		</div>
	);
}
