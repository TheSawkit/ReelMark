'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { loadPanelNotifications } from '@/components/notifications/requests';
import { useUnreadNotifications } from '@/lib/stores/notifications';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import type { AppNotification } from '@/types/notifications';

function Badge({ count }: { count: number }) {
	if (count <= 0) return null;
	return (
		<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
			{count > 9 ? '9+' : count}
		</span>
	);
}

interface NotificationBellProps {
	variant: 'desktop' | 'mobile';
	userId: string;
	initialUnreadCount: number;
}

export function NotificationBell({
	variant,
	userId,
	initialUnreadCount,
}: NotificationBellProps) {
	const { t, lang } = useTranslation();
	const unreadCount = useUnreadNotifications(initialUnreadCount, userId);
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<Promise<
		AppNotification[]
	> | null>(null);

	function handleOpenChange(nextOpen: boolean) {
		if (nextOpen) setNotifications(loadPanelNotifications());
		setOpen(nextOpen);
	}

	if (variant === 'mobile') {
		return (
			<Button
				asChild
				variant="ghost"
				size="icon"
				aria-label={t.navbar.notifications}
				className="relative text-muted transition-colors hover:text-text"
			>
				<Link href={localizedHref(lang, '/notifications')}>
					<Bell className="h-5 w-5" />
					<Badge count={unreadCount} />
				</Link>
			</Button>
		);
	}

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label={t.navbar.notifications}
					className="relative text-muted transition-colors hover:text-text"
				>
					<Bell className="h-5 w-5" />
					<Badge count={unreadCount} />
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				{notifications && (
					<NotificationPanel
						notifications={notifications}
						onClose={() => setOpen(false)}
					/>
				)}
			</PopoverContent>
		</Popover>
	);
}
