'use client';

import { usePathname } from 'next/navigation';
import { NavbarGradient } from '@/components/navigation/NavbarGradient';

export function PageTopGradient() {
	const pathname = usePathname();

	if (pathname?.startsWith('/movie') || pathname?.startsWith('/tv'))
		return null;

	return <NavbarGradient color="var(--color-primary)" />;
}
