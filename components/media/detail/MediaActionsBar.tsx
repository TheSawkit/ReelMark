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
				'fixed inset-x-0 bottom-0 z-40 transition-all duration-(--duration-base) ease-in-out',
				scrolled
					? 'opacity-100 translate-y-0'
					: 'opacity-0 translate-y-full pointer-events-none'
			)}
		>
			<div
				className="bg-surface/70 backdrop-blur-3xl backdrop-saturate-150 border-t border-border/20 shadow-card"
				style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
			>
				<div className="container mx-auto px-6 h-16 flex items-center justify-center gap-3">
					{children}
				</div>
			</div>
		</div>
	);
}
