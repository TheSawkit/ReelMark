'use client';

import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useMediaHeader } from '@/lib/media-header-store';
import { useIsMobile } from '@/hooks/useIsMobile';

interface MediaActionsBarProps {
	children: ReactNode;
}

/**
 * Sticky media actions. Desktop: fixed bar at the bottom. Below lg: portaled
 * into the navbar's trailing slot, crossfading with search/notifications.
 */
export function MediaActionsBar({ children }: MediaActionsBarProps) {
	const { scrolled } = useMediaHeader();
	const isMobile = useIsMobile();

	if (isMobile) {
		const slot =
			typeof document !== 'undefined'
				? document.getElementById('rm-nav-actions')
				: null;
		if (!slot) return null;
		return createPortal(
			<div
				className={cn(
					'flex items-center gap-2 transition-all duration-(--duration-base) ease-apple',
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

	return (
		<div
			className={cn(
				'fixed inset-x-0 bottom-0 z-40 transition-all duration-(--duration-base) ease-in-out',
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
		</div>
	);
}
