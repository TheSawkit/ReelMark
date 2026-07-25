'use client';

import Image from 'next/image';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types/notifications';

interface NotificationToastProps {
	notification: AppNotification;
	message: string;
	openLabel: string;
	onOpen?: () => void;
}

/** Live notification popped by the realtime channel, with the sender avatar or the poster. */
export function NotificationToast({
	notification,
	message,
	openLabel,
	onOpen,
}: NotificationToastProps) {
	const visual = notification.type.startsWith('friend') ? (
		<UserAvatar
			fullName={notification.senderUsername ?? undefined}
			size={36}
			className="h-9 w-9 shrink-0"
		/>
	) : notification.posterPath ? (
		<Image
			src={`https://image.tmdb.org/t/p/w92${notification.posterPath}`}
			alt=""
			width={32}
			height={48}
			className="h-12 w-8 shrink-0 rounded-md object-cover"
		/>
	) : null;

	const content = (
		<div className="flex items-center gap-3">
			{visual}
			<p className="min-w-0 flex-1 text-sm leading-snug text-text">
				{message}
			</p>
		</div>
	);

	const surface =
		'w-full rounded-xl border border-border-subtle bg-surface p-3 shadow-card';

	if (!onOpen) return <div className={surface}>{content}</div>;

	return (
		<button
			type="button"
			onClick={onOpen}
			aria-label={openLabel}
			className={cn(
				surface,
				'text-left transition-colors hover:bg-surface-2',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
			)}
		>
			{content}
		</button>
	);
}
