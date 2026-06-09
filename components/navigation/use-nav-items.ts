'use client';

import { usePathname } from 'next/navigation';
import { Home, Compass, Library, User, type LucideIcon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref, stripLocale } from '@/lib/i18n/utils';

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
	const { t, lang } = useTranslation();
	const path = stripLocale(pathname);
	const profileHref = username ? `/profile/${username}` : '/settings';

	return [
		{
			key: 'home',
			href: localizedHref(lang, '/dashboard'),
			label: t.navbar.tabs.home,
			icon: Home,
			active: path === '/dashboard',
		},
		{
			key: 'explore',
			href: localizedHref(lang, '/explorer'),
			label: t.navbar.tabs.explore,
			icon: Compass,
			active: path.startsWith('/explorer'),
		},
		{
			key: 'library',
			href: localizedHref(lang, '/library'),
			label: t.navbar.tabs.library,
			icon: Library,
			active: path === '/library',
		},
		{
			key: 'profile',
			href: localizedHref(lang, profileHref),
			label: t.navbar.tabs.profile,
			icon: User,
			active: path.startsWith('/profile'),
		},
	];
}
