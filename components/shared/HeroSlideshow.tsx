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

const SWIPE_THRESHOLD_PX = 50;

interface HeroSlideshowProps {
	slides: ReactNode[];
	label: string;
}

/**
 * Cross-fading hero carousel for a `.hero-stage`: only the first slide is server-rendered (its
 * image stays the LCP), the others mount once the page has loaded and the browser is idle.
 * Advances every `--duration-slideshow` (5 s): the active dot fills up meanwhile and its animation
 * end triggers the next slide, so the progress shown is exactly the time left. Paused on hover,
 * keyboard focus and off-screen; under "reduce motion" the dot never animates, so it never
 * advances. Dots and horizontal swipes navigate by hand.
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
	const isPlaying = !isPaused && isInView;

	useEffect(() => {
		let cancelled = false;
		afterLoadAndIdle().then(() => {
			if (!cancelled) setIsReady(true);
		});
		return () => {
			cancelled = true;
		};
	}, []);

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
							className="group grid h-6 min-w-6 place-items-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							<span
								className={cn(
									'h-1.5 overflow-hidden rounded-full transition-all duration-(--duration-base) ease-apple',
									index === current
										? 'w-6 bg-text/30'
										: 'w-1.5 bg-text/40 group-hover:bg-text/70'
								)}
							>
								{index === current && (
									<span
										data-slide-progress
										className="block h-full origin-left rounded-full bg-text motion-safe:animate-slide-progress"
										style={{
											animationPlayState: isPlaying
												? 'running'
												: 'paused',
										}}
										onAnimationEnd={() => goBy(1)}
									/>
								)}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
