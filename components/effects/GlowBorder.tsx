import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowBorderProps {
	children: ReactNode;
	radius?: number;
	pad?: number;
	run?: boolean;
	className?: string;
}

/** Wraps content with an animated rotating conic-gradient border (accent → gold). */
export function GlowBorder({
	children,
	radius = 16,
	pad = 1.5,
	run = true,
	className,
}: GlowBorderProps) {
	return (
		<div
			className={cn('relative overflow-hidden', className)}
			style={{ borderRadius: radius, padding: pad }}
		>
			<div
				className="absolute -inset-[40%]"
				style={{
					background:
						'conic-gradient(from 0deg, transparent 0deg, rgb(var(--color-red-rgb)) 40deg, var(--gold) 80deg, transparent 130deg, transparent 360deg)',
					animation: run
						? 'conic-spin 4.5s linear infinite'
						: undefined,
				}}
			/>
			<div
				className="relative h-full"
				style={{
					borderRadius: radius - pad,
					background: 'var(--surface)',
				}}
			>
				{children}
			</div>
		</div>
	);
}
