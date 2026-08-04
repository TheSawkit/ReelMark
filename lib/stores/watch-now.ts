'use client';

import { useSyncExternalStore } from 'react';
import { createSubscription } from '@/lib/stores/factory';
import type { WatchNowOption } from '@/lib/watch-now';

const EMPTY: WatchNowOption[] = [];
const { subscribe, notify } = createSubscription();

let current: WatchNowOption[] = EMPTY;

/**
 * Play options of the detail page being viewed, resolved once by the banner and read by the
 * sticky bar — which cannot stream its own copy without tearing the navbar portal it lives in.
 */
export const watchNowStore = {
	seed(options: WatchNowOption[]) {
		if (current === options) return;
		current = options;
		notify();
	},
	release(options: WatchNowOption[]) {
		if (current !== options) return;
		current = EMPTY;
		notify();
	},
	get(): WatchNowOption[] {
		return current;
	},
	subscribe,
};

export function useWatchNowOptions(): WatchNowOption[] {
	return useSyncExternalStore(subscribe, watchNowStore.get, () => EMPTY);
}
