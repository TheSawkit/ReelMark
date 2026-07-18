'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 1023px)';

function subscribe(callback: () => void) {
	const mq = window.matchMedia(QUERY);
	mq.addEventListener('change', callback);
	return () => mq.removeEventListener('change', callback);
}

/** True on viewports below the Tailwind `lg` breakpoint (1024px), where the bottom tab bar lives. SSR-safe. */
export function useIsMobile() {
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(QUERY).matches,
		() => false
	);
}
