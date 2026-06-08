'use client';

import Link from 'next/link';
import Image from 'next/image';
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
	onDelete?: (id: string) => void;
}

export function NotificationItem({
	notification,
	onClick,
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
		'group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
		'hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
	);

	return (
		<div className="relative">
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
			{onDelete && (
				<div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
					<DeleteIconButton
						onClick={() => onDelete(notification.id)}
						ariaLabel={t.notifications.delete}
					/>
				</div>
			)}
		</div>
	);
}
