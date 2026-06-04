'use client';

import { usePathname } from 'next/navigation';
import { Home, Compass, Library, User, type LucideIcon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export interface NavItem {
	key: string;
	href: string;
	label: string;
	icon: LucideIcon;
	active: boolean;
}

/**
 * Single source of truth for primary navigation destinations.
 * Consumed by both the mobile bottom tab bar and the desktop top nav,
 * so labels, icons, routes and active state stay consistent everywhere.
 */
export function useNavItems(username?: string): NavItem[] {
	const pathname = usePathname();
	const { t } = useTranslation();
	const profileHref = username ? `/profile/${username}` : '/settings';

	return [
		{
			key: 'home',
			href: '/dashboard',
			label: t.navbar.tabs.home,
			icon: Home,
			active: pathname === '/dashboard',
		},
		{
			key: 'explore',
			href: '/explorer',
			label: t.navbar.tabs.explore,
			icon: Compass,
			active: pathname.startsWith('/explorer'),
		},
		{
			key: 'library',
			href: '/library',
			label: t.navbar.tabs.library,
			icon: Library,
			active: pathname === '/library',
		},
		{
			key: 'profile',
			href: profileHref,
			label: t.navbar.tabs.profile,
			icon: User,
			active: pathname.startsWith('/profile'),
		},
	];
}
