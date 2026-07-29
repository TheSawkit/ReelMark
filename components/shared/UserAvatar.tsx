'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/context';
import { useBrokenImage } from '@/hooks/useBrokenImage';
interface UserAvatarProps {
	picture?: string;
	fullName?: string;
	email?: string;
	size?: number;
	className?: string;
	loading?: 'lazy' | 'eager';
}

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
	const goldColor = 'd6b25e';

	const avatarUrl =
		picture && !broken.isBroken
			? picture
			: `https://api.dicebear.com/9.x/initials/svg?seed=${
					fullName || email?.split('@')[0] || 'user'
				}&size=${size}&backgroundType=gradientLinear&backgroundColor=${goldColor}&fontWeight=600&fontFamily=Tahoma&chars=1`;

	return (
		<Image
			src={avatarUrl}
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
