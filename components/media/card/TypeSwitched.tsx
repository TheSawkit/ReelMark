'use client';

import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { SwapIn } from '@/components/motion/SwapIn';

/** Renders the variant matching the URL's ?type= — pairs with MediaTypeSwitcher `shallow`. */
export function TypeSwitched({
	movie,
	tv,
}: {
	movie: ReactNode;
	tv: ReactNode;
}) {
	const type = useSearchParams().get('type') === 'tv' ? 'tv' : 'movie';
	return <SwapIn swapKey={type}>{type === 'tv' ? tv : movie}</SwapIn>;
}
