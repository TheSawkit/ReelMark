'use client';

import { useEffect, useRef } from 'react';
import { mediaHeaderStore } from '@/lib/stores/media-header';

/**
 * Publishes a detail hero's title and whether it has scrolled past, for the navbar title and the
 * sticky actions bar. Returns the ref to put on the hero's last row.
 */
export function useBannerHeader(title: string) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		mediaHeaderStore.setMedia(title);
		return () => mediaHeaderStore.clear();
	}, [title]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					mediaHeaderStore.setScrolled(false);
				} else if (window.scrollY > 0) {
					mediaHeaderStore.setScrolled(true);
				}
			},
			{ threshold: 0, rootMargin: '-64px 0px 0px 0px' }
		);

		const el = bottomRef.current;
		if (el) observer.observe(el);
		return () => {
			if (el) observer.unobserve(el);
		};
	}, []);

	return bottomRef;
}
