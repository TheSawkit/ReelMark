'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMediaHeader } from '@/lib/media-header-store';

interface MediaActionsBarProps {
	children: ReactNode;
}

export function MediaActionsBar({ children }: MediaActionsBarProps) {
	const { scrolled } = useMediaHeader();

	return (
		<div
			className={cn(
				'fixed inset-x-0 z-40 transition-all duration-(--duration-base) ease-in-out',
				'top-16 mt-[env(safe-area-inset-top)] md:top-auto md:mt-0 md:bottom-0',
				scrolled
					? 'opacity-100 translate-y-0'
					: 'opacity-0 pointer-events-none -translate-y-full md:translate-y-full'
			)}
		>
			<div className="glass-bar border-b border-border/20 shadow-card md:border-b-0 md:border-t md:pb-[env(safe-area-inset-bottom)]">
				<div className="container mx-auto px-6 h-16 flex items-center justify-center gap-3">
					{children}
				</div>
			</div>
		</div>
	);
}
