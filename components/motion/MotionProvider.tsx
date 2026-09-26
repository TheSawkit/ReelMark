'use client';

import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';
import { afterLoadAndIdle } from '@/lib/idle';

const loadFeatures = () =>
	afterLoadAndIdle()
		.then(() => import('@/components/motion/features'))
		.then((module) => module.default);

/**
 * Motion for the whole app at the cost of the small `m` runtime: the animation, layout and drag
 * features load in their own chunk once the page has loaded and the browser is idle (never
 * competing with the LCP image or the page's own scripts), `strict` forbids the heavy `motion.*`
 * components, and the OS "reduce motion" setting is honoured.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
	return (
		<LazyMotion features={loadFeatures} strict>
			<MotionConfig reducedMotion="user">{children}</MotionConfig>
		</LazyMotion>
	);
}
