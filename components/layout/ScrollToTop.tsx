'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
	const pathname = usePathname();
	const isPopRef = useRef(false);

	useEffect(() => {
		const onPopState = () => {
			isPopRef.current = true;
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	}, []);

	useEffect(() => {
		if (isPopRef.current) {
			isPopRef.current = false;
			return;
		}
		// A link to an anchor (`#ai-assistant`) wants that anchor, not the top of the page.
		if (window.location.hash) return;
		window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
	}, [pathname]);

	return null;
}
