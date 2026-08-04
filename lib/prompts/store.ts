'use client';

import { useSyncExternalStore } from 'react';
import { createSubscription } from '@/lib/stores/factory';
import { pickPrompt } from '@/lib/prompts/engine';
import {
	readDeviceStates,
	readLastShownAt,
	writeDeviceState,
	writeLastShownAt,
} from '@/lib/prompts/device';
import {
	DEVICE_PROMPTS,
	type PromptKey,
	type PromptState,
	type PromptStates,
} from '@/lib/prompts/keys';

interface PromptSlot {
	active: PromptKey | null;
	open: boolean;
}

const CLOSED: PromptSlot = { active: null, open: false };

const { subscribe, notify } = createSubscription();

let slot: PromptSlot = CLOSED;
let states: PromptStates = {};
let hydrated = false;
let pushRequested = false;
let shownThisSession = false;

/**
 * Owns which single call-to-action the current tab may show. State lives outside React
 * so any component can signal an opportunity without re-rendering the whole tree.
 */
export const promptStore = {
	/** Signals that push notifications just became worth offering (a show added, a friend request). */
	requestPush() {
		if (pushRequested) return;
		pushRequested = true;
		notify();
	},

	/** Picks a prompt if every anti-spam rule allows it; safe to call on every render pass. */
	evaluate(
		eligible: readonly PromptKey[],
		accountStates: PromptStates,
		accountCreatedAt: number | null,
		now: number
	) {
		if (!hydrated) {
			hydrated = true;
			states = { ...accountStates, ...readDeviceStates() };
		}
		if (slot.active) return;

		const key = pickPrompt({
			eligible,
			states,
			lastShownAt: readLastShownAt(),
			accountCreatedAt,
			shownThisSession,
			now,
		});
		if (!key) return;

		shownThisSession = true;
		writeLastShownAt(now);
		slot = { active: key, open: true };
		notify();
	},

	/** Closes the banner and remembers the answer so the prompt never comes back. */
	resolve(key: PromptKey, state: PromptState) {
		states = { ...states, [key]: state };
		if (DEVICE_PROMPTS.has(key)) writeDeviceState(key, state);
		slot = { ...slot, open: false };
		notify();
	},
};

export function usePromptSlot(): PromptSlot {
	return useSyncExternalStore(
		subscribe,
		() => slot,
		() => CLOSED
	);
}

export function usePushRequested(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => pushRequested,
		() => false
	);
}
