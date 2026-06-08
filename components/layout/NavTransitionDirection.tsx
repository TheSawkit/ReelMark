'use client';

import { useEffect } from 'react';

/** Tags <html> with the navigation direction so CSS view transitions can slide the page like a native iOS push/pop. */
export function NavTransitionDirection() {
	useEffect(() => {
		const root = document.documentElement;

		const onClick = (e: MouseEvent) => {
			if (e.defaultPrevented || e.button !== 0) return;
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			const link = (e.target as Element | null)?.closest('a[href]');
			if (!(link instanceof HTMLAnchorElement)) return;
			if (link.target && link.target !== '_self') return;
			const url = new URL(link.href, location.href);
			if (url.origin !== location.origin) return;
			if (url.pathname === location.pathname) return;
			root.dataset.navDirection = 'forward';
		};

		const onPopState = () => {
			root.dataset.navDirection = 'back';
		};

		document.addEventListener('click', onClick, true);
		window.addEventListener('popstate', onPopState);
		return () => {
			document.removeEventListener('click', onClick, true);
			window.removeEventListener('popstate', onPopState);
		};
	}, []);

	return null;
}
