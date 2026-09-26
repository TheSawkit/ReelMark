'use client';

import * as m from 'motion/react-m';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motion';

interface ActiveIndicatorProps {
	layoutId: string;
	className: string;
}

/**
 * The marker of the selected item in a segmented control or tab bar. Rendered only inside the
 * active item: when the selection moves, Motion glides it from the old item to the new one with
 * the shared indicator spring, so every switcher of the app moves the same way.
 */
export function ActiveIndicator({ layoutId, className }: ActiveIndicatorProps) {
	return (
		<m.span
			layoutId={layoutId}
			transition={SPRING.indicator}
			aria-hidden
			className={cn('absolute', className)}
		/>
	);
}
