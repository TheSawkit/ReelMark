'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * True when the release date is still ahead. Reports false during SSR: "now" is not
 * deterministic at prerender time, so the answer is only trustworthy on the client.
 */
export function useIsUnreleased(releaseDate?: string): boolean {
	return useSyncExternalStore(
		subscribe,
		() => (releaseDate ? new Date(releaseDate) > new Date() : false),
		() => false
	);
}
