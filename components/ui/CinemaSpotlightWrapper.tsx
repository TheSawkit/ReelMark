'use client';

import { usePathname } from 'next/navigation';
import CinemaSpotlight from '@/components/ui/cinema-spotlight';
import { stripLocale } from '@/lib/i18n/utils';

export default function CinemaSpotlightWrapper() {
	const pathname = usePathname();
	const path = stripLocale(pathname);

	if (path.startsWith('/movie') || path.startsWith('/tv')) {
		return null;
	}

	return <CinemaSpotlight />;
}
