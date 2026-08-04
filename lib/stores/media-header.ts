'use client';

import { useSyncExternalStore } from 'react';
import { createSubscription } from '@/lib/stores/factory';

type State = { title: string | null; scrolled: boolean };

const EMPTY: State = { title: null, scrolled: false };
const { subscribe, notify } = createSubscription();

let state: State = EMPTY;

export const mediaHeaderStore = {
	setMedia: (title: string | null) => {
		state = { title, scrolled: false };
		notify();
	},
	setScrolled: (scrolled: boolean) => {
		if (state.scrolled === scrolled) return;
		state = { ...state, scrolled };
		notify();
	},
	clear: () => {
		state = EMPTY;
		notify();
	},
};

export function useMediaHeader() {
	return useSyncExternalStore(
		subscribe,
		() => state,
		() => EMPTY
	);
}
