'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False on the server and during hydration, true afterwards: gates portals so the first client render matches the HTML. */
export function useIsClient(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => true,
		() => false
	);
}
