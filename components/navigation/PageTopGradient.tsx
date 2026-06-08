'use client';

import { usePathname } from 'next/navigation';
import { NavbarGradient } from '@/components/navigation/NavbarGradient';
import { stripLocale } from '@/lib/i18n/utils';

export function PageTopGradient() {
	const pathname = usePathname();
	const path = stripLocale(pathname);

	if (path.startsWith('/movie') || path.startsWith('/tv')) return null;

	return <NavbarGradient color="var(--color-primary)" />;
}
