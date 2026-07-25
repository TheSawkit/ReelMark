'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
	children: ReactNode;
	max?: number;
	radius?: string;
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

const GLOW_SIZE = 360;

/**
 * 3D pointer-tilt card with a glow that follows the cursor.
 * Pointer moves write CSS variables directly (rAF-throttled) — no React
 * re-render per frame, and the glow spot moves via composited transform.
 * Tilt is disabled on touch and reduced-motion devices.
 */
export function TiltCard({
	children,
	max = 10,
	radius = 'var(--radius-xl)',
	glow = true,
	className,
	onClick,
}: TiltCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const frame = useRef(0);

	const handleMove = (e: PointerEvent<HTMLDivElement>) => {
		if (!tiltEnabled()) return;
		const el = ref.current;
		if (!el) return;
		const { clientX, clientY } = e;
		cancelAnimationFrame(frame.current);
		frame.current = requestAnimationFrame(() => {
			const r = el.getBoundingClientRect();
			const px = (clientX - r.left) / r.width;
			const py = (clientY - r.top) / r.height;
			el.style.setProperty('--tilt-rx', `${(0.5 - py) * max}deg`);
			el.style.setProperty('--tilt-ry', `${(px - 0.5) * max}deg`);
			el.style.setProperty('--tilt-scale', '1.03');
			el.style.setProperty('--tilt-transition', 'transform .08s linear');
			el.style.setProperty('--glow-x', `${clientX - r.left}px`);
			el.style.setProperty('--glow-y', `${clientY - r.top}px`);
			el.style.setProperty('--glow-opacity', '1');
		});
	};

	const handleLeave = () => {
		const el = ref.current;
		if (!el) return;
		cancelAnimationFrame(frame.current);
		el.style.setProperty('--tilt-rx', '0deg');
		el.style.setProperty('--tilt-ry', '0deg');
		el.style.setProperty('--tilt-scale', '1');
		el.style.setProperty(
			'--tilt-transition',
			'transform .5s var(--ease-apple-spring)'
		);
		el.style.setProperty('--glow-opacity', '0');
	};

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
					transform:
						'rotateX(var(--tilt-rx, 0deg)) rotateY(var(--tilt-ry, 0deg)) scale(var(--tilt-scale, 1))',
					transition:
						'var(--tilt-transition, transform .5s var(--ease-apple-spring))',
					willChange: 'transform',
				}}
			>
				{children}
				{glow && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-300"
						style={{
							borderRadius: radius,
							opacity: 'var(--glow-opacity, 0)',
						}}
					>
						<div
							className="absolute left-0 top-0 rounded-full will-change-transform"
							style={{
								height: GLOW_SIZE,
								width: GLOW_SIZE,
								background:
									'radial-gradient(circle, rgb(255 255 255 / 0.18), transparent 50%)',
								transform: `translate(calc(var(--glow-x, -${GLOW_SIZE}px) - ${GLOW_SIZE / 2}px), calc(var(--glow-y, -${GLOW_SIZE}px) - ${GLOW_SIZE / 2}px))`,
							}}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
