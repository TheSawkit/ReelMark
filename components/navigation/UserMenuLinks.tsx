'use client';

import Link from 'next/link';
import { User, Settings } from 'lucide-react';
import { SignoutButton } from '@/components/auth/SignoutButton';
import { useTranslation } from '@/lib/i18n/context';

interface UserMenuLinksProps {
	username?: string;
	onAction?: () => void;
}

export function UserMenuLinks({ username, onAction }: UserMenuLinksProps) {
	const { t } = useTranslation();
	const linkClass =
		'flex items-center gap-2 px-4 py-2 rounded-md text-muted hover:text-text hover:bg-surface-2 transition-colors';

	return (
		<div className="flex flex-col gap-2">
			{username && (
				<Link
					href={`/profile/${username}`}
					className={linkClass}
					onClick={onAction}
				>
					<User className="h-4 w-4" />
					<span>{t.navbar.profile}</span>
				</Link>
			)}
			<Link href="/settings" className={linkClass} onClick={onAction}>
				<Settings className="h-4 w-4" />
				<span>{t.navbar.settings}</span>
			</Link>
			<div className="px-4">
				<SignoutButton />
			</div>
		</div>
	);
}
