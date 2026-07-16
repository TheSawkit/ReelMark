'use client';

import { useSyncExternalStore } from 'react';
import { calculateAge } from '@/lib/format';

const subscribe = () => () => {};

/**
 * Age in years, or null when it cannot be known yet. A living person's age depends on
 * "now", which is not deterministic at prerender time; a deceased person's never is.
 */
export function useAge(
	birthday: string | null,
	deathday: string | null
): number | null {
	return useSyncExternalStore(
		subscribe,
		() => calculateAge(birthday, deathday),
		() => (deathday ? calculateAge(birthday, deathday) : null)
	);
}
