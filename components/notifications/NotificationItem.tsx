'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { DeleteIconButton } from '@/components/ui/DeleteIconButton';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { notificationMessage } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types/notifications';

interface NotificationItemProps {
	notification: AppNotification;
	onClick?: (n: AppNotification) => void;
	onMarkRead: (n: AppNotification) => void;
	onDelete: (n: AppNotification) => void;
}

export function NotificationItem({
	notification,
	onClick,
	onMarkRead,
	onDelete,
}: NotificationItemProps) {
	const { t, lang } = useTranslation();
	const message = notificationMessage(
		notification,
		t.notifications.templates
	);
	const isFriend = notification.type.startsWith('friend');
	const unread = !notification.readAt;

	const visual = isFriend ? (
		<UserAvatar
			picture={notification.senderAvatarUrl ?? undefined}
			fullName={notification.senderUsername ?? undefined}
			size={40}
			className="h-10 w-10 shrink-0"
		/>
	) : notification.posterPath ? (
		<Image
			src={`https://image.tmdb.org/t/p/w92${notification.posterPath}`}
			alt={notification.mediaTitle ?? ''}
			width={36}
			height={54}
			className="h-[54px] w-9 shrink-0 rounded-md object-cover"
		/>
	) : null;

	const inner = (
		<>
			{visual}
			<div className="min-w-0 flex-1">
				<p
					className={cn(
						'text-sm leading-snug',
						unread ? 'font-medium text-text' : 'text-muted'
					)}
				>
					{message}
				</p>
			</div>
			{unread && (
				<span
					aria-hidden
					className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
				/>
			)}
		</>
	);

	const itemClassName = cn(
		'flex items-start gap-3 rounded-lg py-2.5 pl-3 transition-colors',
		unread ? 'pr-18' : 'pr-10',
		'hover:bg-surface-2 active:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
	);

	return (
		<div className="group relative">
			{notification.url ? (
				<Link
					href={localizedHref(lang, notification.url)}
					prefetch={false}
					onClick={() => onClick?.(notification)}
					className={itemClassName}
				>
					{inner}
				</Link>
			) : (
				<div className={itemClassName}>{inner}</div>
			)}
			<div className="absolute right-1 top-1 flex gap-0.5 transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100">
				{unread && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onMarkRead(notification)}
						className="h-8 w-8 shrink-0 p-0 text-muted hover:text-text"
						aria-label={t.notifications.markRead}
					>
						<Check className="h-4 w-4" />
					</Button>
				)}
				<DeleteIconButton
					onClick={() => onDelete(notification)}
					ariaLabel={t.notifications.delete}
				/>
			</div>
		</div>
	);
}
