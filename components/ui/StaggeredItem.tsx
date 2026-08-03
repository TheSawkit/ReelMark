import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StaggeredItemProps {
	index: number;
	staggerMs?: number;
	duration?: string;
	className?: string;
	children: ReactNode;
}

// Au-delà, la cascade cesse d'être lisible et la dernière carte d'une grille de 40 partirait
// deux secondes après la première.
const MAX_STAGGER_STEPS = 8;

/** Animates children in with a per-index delay, creating a staggered cascade effect on mount. */
export function StaggeredItem({
	index,
	staggerMs = 50,
	duration = 'var(--duration-base)',
	className,
	children,
}: StaggeredItemProps) {
	return (
		<div
			className={cn('stagger-rise', className)}
			style={{
				animationDuration: duration,
				animationDelay: `${Math.min(index, MAX_STAGGER_STEPS) * staggerMs}ms`,
			}}
		>
			{children}
		</div>
	);
}
