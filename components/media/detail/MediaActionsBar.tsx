'use client';

import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useMediaHeader } from '@/lib/stores/media-header';
import { useIsMobile } from '@/hooks/useIsMobile';

interface MediaActionsBarProps {
	children: ReactNode;
}

/**
 * Sticky media actions. Desktop: fixed bar at the bottom. Below lg: portaled
 * into the navbar's trailing slot, crossfading with search/notifications.
 * Both variants are portaled out of the page subtree: any transform on an
 * ancestor would make it the containing block and tear the bar off the viewport.
 */
export function MediaActionsBar({ children }: MediaActionsBarProps) {
	const { scrolled } = useMediaHeader();
	const isMobile = useIsMobile();

	if (typeof document === 'undefined') return null;

	if (isMobile) {
		const slot = document.getElementById('rm-nav-actions');
		if (!slot) return null;
		return createPortal(
			<div
				className={cn(
					'flex items-center gap-2 transition-[opacity,transform,visibility] duration-(--duration-base) ease-apple',
					scrolled
						? 'visible scale-100 opacity-100'
						: 'invisible scale-95 opacity-0'
				)}
			>
				{children}
			</div>,
			slot
		);
	}

	return createPortal(
		<div
			className={cn(
				'fixed inset-x-0 bottom-0 z-40 transition duration-(--duration-base) ease-in-out',
				scrolled
					? 'opacity-100 translate-y-0'
					: 'opacity-0 translate-y-full pointer-events-none'
			)}
		>
			<div className="glass-bar border-t border-border/20 shadow-card pb-[env(safe-area-inset-bottom)]">
				<div className="container mx-auto px-6 h-16 flex items-center justify-center gap-3">
					{children}
				</div>
			</div>
		</div>,
		document.body
	);
}
