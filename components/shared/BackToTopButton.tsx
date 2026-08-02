'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

const SCROLL_THRESHOLD = 300;

/**
 * Floating control that smooth-scrolls the window back to the top of long list views.
 * Portaled to the body: any transform on an ancestor would make it the containing block
 * and tear the button off the viewport.
 */
export function BackToTopButton() {
	const { t } = useTranslation();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	function scrollToTop() {
		const reduceMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;
		window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
	}

	if (typeof document === 'undefined') return null;

	return createPortal(
		<button
			type="button"
			onClick={scrollToTop}
			inert={!visible}
			data-slot="back-to-top-button"
			data-state={visible ? 'visible' : 'hidden'}
			aria-label={t.common.backToTop}
			className={cn(
				'glass-surface fixed right-4 bottom-24 z-40 grid size-11 place-items-center rounded-full text-text shadow-card-lift md:right-6 md:bottom-8',
				'transition duration-(--duration-base) ease-apple motion-reduce:transition-none',
				'hover:scale-105 hover:opacity-100 active:scale-95',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
				visible
					? 'translate-y-0 opacity-70'
					: 'pointer-events-none translate-y-4 opacity-0'
			)}
		>
			<ChevronUp className="size-5" aria-hidden />
		</button>,
		document.body
	);
}
