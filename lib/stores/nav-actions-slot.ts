'use client';

import { useSyncExternalStore } from 'react';
import { createSubscription } from '@/lib/stores/factory';

const { subscribe, notify } = createSubscription();

let slot: HTMLElement | null = null;

/**
 * The navbar's trailing slot where a detail page portals its sticky actions below `lg`. Published
 * by the navbar's ref once it is mounted, never looked up in the DOM: a portal written into the
 * server HTML before the navbar hydrates makes React's hydration fail (#418).
 */
export const navActionsSlot = {
	register(element: HTMLElement | null) {
		if (slot === element) return;
		slot = element;
		notify();
	},
	get(): HTMLElement | null {
		return slot;
	},
	subscribe,
};

export function useNavActionsSlot(): HTMLElement | null {
	return useSyncExternalStore(subscribe, navActionsSlot.get, () => null);
}
