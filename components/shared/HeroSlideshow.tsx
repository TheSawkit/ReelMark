'use client';

import {
	useEffect,
	useRef,
	useState,
	type FocusEvent,
	type PointerEvent,
	type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { afterLoadAndIdle } from '@/lib/idle';
import { useInView } from '@/hooks/useInView';
import { useTranslation } from '@/lib/i18n/context';

const INTERVAL_MS = 7000;
const SWIPE_THRESHOLD_PX = 50;

interface HeroSlideshowProps {
	slides: ReactNode[];
	label: string;
}

function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Cross-fading hero carousel for a `.hero-stage`: only the first slide is server-rendered (its
 * image stays the LCP), the others mount once the page has loaded and the browser is idle.
 * Advances every 7 s, paused on hover, keyboard focus, off-screen and "reduce motion"; dots and
 * horizontal swipes navigate by hand.
 */
export function HeroSlideshow({ slides, label }: HeroSlideshowProps) {
	const { t } = useTranslation();
	const rootRef = useRef<HTMLDivElement>(null);
	const swipeStart = useRef<{ x: number; y: number } | null>(null);
	const [active, setActive] = useState(0);
	const [isReady, setIsReady] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const isInView = useInView(rootRef);

	const count = slides.length;
	const current = Math.min(active, count - 1);
	const canSlide = isReady && count > 1;

	useEffect(() => {
		let cancelled = false;
		afterLoadAndIdle().then(() => {
			if (!cancelled) setIsReady(true);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!canSlide || isPaused || !isInView || prefersReducedMotion())
			return;
		const timer = window.setTimeout(
			() => setActive((current + 1) % count),
			INTERVAL_MS
		);
		return () => window.clearTimeout(timer);
	}, [canSlide, isPaused, isInView, current, count]);

	function goBy(step: number) {
		setActive((current + step + count) % count);
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.pointerType !== 'touch') return;
		swipeStart.current = { x: event.clientX, y: event.clientY };
	}

	function handlePointerUp(event: PointerEvent) {
		const start = swipeStart.current;
		swipeStart.current = null;
		if (!start || !canSlide) return;
		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy))
			return;
		goBy(dx < 0 ? 1 : -1);
	}

	function handleBlur(event: FocusEvent) {
		if (!event.currentTarget.contains(event.relatedTarget))
			setIsPaused(false);
	}

	return (
		<div
			ref={rootRef}
			role="region"
			aria-roledescription="carousel"
			aria-label={label}
			className="grid flex-1 touch-pan-y"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onFocus={() => setIsPaused(true)}
			onBlur={handleBlur}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerCancel={() => (swipeStart.current = null)}
		>
			{slides.map((slide, index) =>
				index === 0 || isReady ? (
					<div
						key={index}
						role="group"
						aria-roledescription="slide"
						aria-label={t.common.slideOf
							.replace('${index}', String(index + 1))
							.replace('${total}', String(count))}
						inert={index !== current}
						className={cn(
							'col-start-1 row-start-1 flex flex-col justify-end transition-opacity duration-(--duration-slower) ease-apple',
							index === current
								? 'z-1 opacity-100'
								: 'pointer-events-none z-0 opacity-0'
						)}
					>
						{slide}
					</div>
				) : null
			)}

			{canSlide && (
				<div className="absolute inset-x-0 bottom-1 z-20 container mx-auto flex justify-center gap-1 px-6 sm:bottom-3 md:justify-start lg:px-12">
					{slides.map((_, index) => (
						<button
							key={index}
							type="button"
							aria-label={t.common.goToSlide.replace(
								'${index}',
								String(index + 1)
							)}
							aria-current={index === current}
							onClick={() => setActive(index)}
							className="group grid h-6 min-w-6 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							<span
								className={cn(
									'h-1.5 rounded-full transition-all duration-(--duration-base) ease-apple',
									index === current
										? 'w-5 bg-text'
										: 'w-1.5 bg-text/40 group-hover:bg-text/70'
								)}
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
