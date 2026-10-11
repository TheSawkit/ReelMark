'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { useNotificationChanges } from '@/lib/stores/notifications';
import { useTranslation } from '@/lib/i18n/context';
import type { AppNotification } from '@/types/notifications';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { SPRING } from '@/lib/motion';

export function NotificationsList({ initial }: { initial: AppNotification[] }) {
	const { t } = useTranslation();
	const items = useNotificationChanges(initial);
	const { markRead, remove, markAllRead } = useNotificationActions();

	if (items.length === 0)
		return <EmptyState message={t.notifications.empty} icon={Bell} />;

	return (
		<div>
			<div className="mb-2 flex justify-end">
				<button
					onClick={markAllRead}
					className="flex items-center gap-1 text-sm text-muted hover:text-text transition-colors cursor-pointer"
				>
					<CheckCheck className="h-4 w-4" />
					{t.notifications.markAllRead}
				</button>
			</div>
			<div className="space-y-0.5">
				<AnimatePresence initial={false} mode="popLayout">
					{items.map((n) => (
						<m.div
							key={n.id}
							layout
							exit={{ opacity: 0, x: -24 }}
							transition={SPRING.list}
						>
							<NotificationItem
								notification={n}
								onMarkRead={markRead}
								onDelete={remove}
							/>
						</m.div>
					))}
				</AnimatePresence>
			</div>
		</div>
	);
}
