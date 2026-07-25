import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowBorderProps {
	children: ReactNode;
	radius?: string;
	pad?: number;
	run?: boolean;
	className?: string;
}

/** Wraps content with an animated rotating light-sheen border; pass the child's radius token so the sheen stays concentric with its corners. */
export function GlowBorder({
	children,
	radius = 'var(--radius-xl)',
	pad = 1.5,
	run = true,
	className,
}: GlowBorderProps) {
	return (
		<div
			className={cn('relative overflow-hidden', className)}
			style={{ borderRadius: `calc(${radius} + ${pad}px)`, padding: pad }}
		>
			<div
				className="absolute -inset-[40%]"
				style={{
					background:
						'conic-gradient(from 0deg, transparent 0deg, color-mix(in srgb, var(--text) 25%, transparent) 40deg, color-mix(in srgb, var(--text) 80%, transparent) 80deg, transparent 130deg, transparent 360deg)',
					animation: run
						? 'conic-spin 4.5s linear infinite'
						: undefined,
				}}
			/>
			<div
				className="relative h-full"
				style={{
					borderRadius: radius,
					background: 'var(--surface)',
				}}
			>
				{children}
			</div>
		</div>
	);
}
