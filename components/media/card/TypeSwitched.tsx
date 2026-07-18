'use client';

import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

/** Renders the variant matching the URL's ?type= — pairs with MediaTypeSwitcher `shallow`. */
export function TypeSwitched({
	movie,
	tv,
}: {
	movie: ReactNode;
	tv: ReactNode;
}) {
	const searchParams = useSearchParams();
	return <>{searchParams.get('type') === 'tv' ? tv : movie}</>;
}
