'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useHasChanged } from '@/hooks/useHasChanged';

/**
 * Fades its content in each time `swapKey` changes (media type, tab), never on the first paint:
 * server-rendered content must not start hidden. Layout-neutral (`display: contents`) and
 * opacity-only, so it never becomes the containing block of the swapped content.
 */
export function SwapIn({
	swapKey,
	children,
}: {
	swapKey: string;
	children: ReactNode;
}) {
	const hasChanged = useHasChanged(swapKey);
	return (
		<div
			key={swapKey}
			className={cn('contents', hasChanged && '*:animate-swap-in')}
		>
			{children}
		</div>
	);
}
