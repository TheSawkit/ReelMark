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
 * Sticky media actions. Desktop: fixed bar at the bottom. Mobile: portaled into
 * the navbar as an expanding sub-bar (so it never overlaps the fixed navbar).
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
					'overflow-hidden transition-all duration-(--duration-base) ease-in-out',
					scrolled
						? 'max-h-20 opacity-100'
						: 'max-h-0 opacity-0 pointer-events-none'
				)}
			>
				<div className="h-14 flex items-center justify-center gap-3 border-t border-border/15">
					{children}
				</div>
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
