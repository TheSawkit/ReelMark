import { useSyncExternalStore } from 'react';
import type { WatchNowOption } from '@/lib/watch-now';

const EMPTY: WatchNowOption[] = [];

let current: WatchNowOption[] = EMPTY;
const listeners = new Set<() => void>();

function emit() {
	for (const listener of listeners) listener();
}

/**
 * Play options of the detail page being viewed, resolved once by the banner and read by the
 * sticky bar — which cannot stream its own copy without tearing the navbar portal it lives in.
 */
export const watchNowStore = {
	seed(options: WatchNowOption[]) {
		if (current === options) return;
		current = options;
		emit();
	},
	release(options: WatchNowOption[]) {
		if (current !== options) return;
		current = EMPTY;
		emit();
	},
	get(): WatchNowOption[] {
		return current;
	},
	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};

export function useWatchNowOptions(): WatchNowOption[] {
	return useSyncExternalStore(
		watchNowStore.subscribe,
		watchNowStore.get,
		() => EMPTY
	);
}
