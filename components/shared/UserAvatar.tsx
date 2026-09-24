'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/context';
import { useBrokenImage } from '@/hooks/useBrokenImage';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
	picture?: string;
	fullName?: string;
	email?: string;
	size?: number;
	className?: string;
	loading?: 'lazy' | 'eager';
}

const INITIAL_TO_SIZE_RATIO = 0.45;

/** Profile picture, or the user's initial drawn locally when there is none or it fails to load. */
export function UserAvatar({
	picture,
	fullName,
	email,
	size = 128,
	className,
	loading = 'lazy',
}: UserAvatarProps) {
	const { t } = useTranslation();
	const broken = useBrokenImage(picture);

	if (!picture || broken.isBroken) {
		const initial = (fullName || email || '?')
			.trim()
			.charAt(0)
			.toUpperCase();
		return (
			<span
				role="img"
				aria-label={t.common.userAvatar}
				style={{
					width: size,
					height: size,
					fontSize: size * INITIAL_TO_SIZE_RATIO,
				}}
				className={cn(
					'inline-grid shrink-0 select-none place-items-center bg-gold font-semibold text-background',
					className
				)}
			>
				{initial}
			</span>
		);
	}

	return (
		<Image
			src={picture}
			onError={broken.onError}
			alt={t.common.userAvatar}
			width={size}
			height={size}
			className={className}
			unoptimized
			loading={loading}
			priority={loading === 'eager'}
			referrerPolicy="no-referrer"
		/>
	);
}
