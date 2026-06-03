'use client';

import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
	children: ReactNode;
	max?: number;
	radius?: number;
	glow?: boolean;
	className?: string;
	onClick?: () => void;
}

function tiltEnabled() {
	if (typeof window === 'undefined' || !window.matchMedia) return false;
	return (
		window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
		!window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/**
 * 3D pointer-tilt card with a glow that follows the cursor.
 * Tilt is disabled on touch and reduced-motion devices (no JS work there).
 */
export function TiltCard({
	children,
	max = 10,
	radius = 14,
	glow = true,
	className,
	onClick,
}: TiltCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, on: false });

	const handleMove = (e: PointerEvent<HTMLDivElement>) => {
		if (!tiltEnabled()) return;
		const el = ref.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const px = (e.clientX - r.left) / r.width;
		const py = (e.clientY - r.top) / r.height;
		setT({
			rx: (0.5 - py) * max,
			ry: (px - 0.5) * max,
			gx: px * 100,
			gy: py * 100,
			on: true,
		});
	};
	const handleLeave = () => setT((s) => ({ ...s, rx: 0, ry: 0, on: false }));

	return (
		<div
			ref={ref}
			onPointerMove={handleMove}
			onPointerLeave={handleLeave}
			onClick={onClick}
			className={cn(onClick && 'cursor-pointer', className)}
			style={{ perspective: 700 }}
		>
			<div
				className="relative"
				style={{
					borderRadius: radius,
					transformStyle: 'preserve-3d',
					transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg) scale(${t.on ? 1.03 : 1})`,
					transition: t.on
						? 'transform .08s linear'
						: 'transform .5s var(--ease-apple-spring)',
					willChange: t.on ? 'transform' : undefined,
				}}
			>
				{children}
				{glow && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0"
						style={{
							borderRadius: radius,
							background: `radial-gradient(180px circle at ${t.gx}% ${t.gy}%, rgb(255 255 255 / 0.18), transparent 50%)`,
							opacity: t.on ? 1 : 0,
							transition: 'opacity .3s',
						}}
					/>
				)}
			</div>
		</div>
	);
}
