'use client';

import { useRef, type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/** Halts descendant CSS animations while the block is outside the viewport — idle GPU cost drops to zero. */
export function PauseWhenOffscreen({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { rootMargin: '100px' });

	return (
		<div ref={ref} className={cn(className, !isInView && 'motion-paused')}>
			{children}
		</div>
	);
}
