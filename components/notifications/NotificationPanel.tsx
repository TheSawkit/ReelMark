'use client';

import { Suspense, use } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { useNotificationChanges } from '@/lib/stores/notifications';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import type { AppNotification } from '@/types/notifications';

interface NotificationPanelProps {
	notifications: Promise<AppNotification[]>;
	onClose: () => void;
}

function PanelItems({ notifications, onClose }: NotificationPanelProps) {
	const { t } = useTranslation();
	const items = useNotificationChanges(use(notifications));
	const { markRead, remove } = useNotificationActions();

	if (items.length === 0)
		return <EmptyState icon={Bell} message={t.notifications.empty} />;

	return items.map((n) => (
		<NotificationItem
			key={n.id}
			notification={n}
			onClick={onClose}
			onMarkRead={markRead}
			onDelete={remove}
		/>
	));
}

export function NotificationPanel({
	notifications,
	onClose,
}: NotificationPanelProps) {
	const { t, lang } = useTranslation();
	const { markAllRead } = useNotificationActions();

	return (
		<div className="w-80 max-w-[calc(100vw-2rem)] p-2">
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="heading-display leading-none text-lg text-text">
					{t.notifications.title}
				</span>
				<button
					onClick={markAllRead}
					className="flex cursor-pointer items-center gap-1 text-xs text-muted transition-colors hover:text-text"
				>
					<CheckCheck className="h-3.5 w-3.5" />
					{t.notifications.markAllRead}
				</button>
			</div>

			<div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
				<Suspense fallback={null}>
					<PanelItems
						notifications={notifications}
						onClose={onClose}
					/>
				</Suspense>
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
