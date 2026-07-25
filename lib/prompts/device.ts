import {
	DEVICE_PROMPTS,
	type PromptKey,
	type PromptState,
	type PromptStates,
} from './keys';

const STATE_PREFIX = 'reelmark:prompt:';
const LAST_SHOWN_KEY = 'reelmark:prompt-last-shown';
const VISIT_COUNT_KEY = 'reelmark:prompt-visits';
const VISIT_FLAG_KEY = 'reelmark:prompt-visit-counted';

/** Answers to device-scoped prompts, stored per browser since a push permission is. */
export function readDeviceStates(): PromptStates {
	const states: PromptStates = {};
	try {
		for (const key of DEVICE_PROMPTS) {
			const raw = localStorage.getItem(`${STATE_PREFIX}${key}`);
			if (raw === 'done' || raw === 'dismissed') states[key] = raw;
		}
	} catch {
		return states;
	}
	return states;
}

export function writeDeviceState(key: PromptKey, state: PromptState): void {
	try {
		localStorage.setItem(`${STATE_PREFIX}${key}`, state);
	} catch {
		return;
	}
}

export function readLastShownAt(): number | null {
	try {
		const raw = localStorage.getItem(LAST_SHOWN_KEY);
		const parsed = raw === null ? NaN : Number(raw);
		return Number.isFinite(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function writeLastShownAt(timestamp: number): void {
	try {
		localStorage.setItem(LAST_SHOWN_KEY, String(timestamp));
	} catch {
		return;
	}
}

/**
 * How many visits this browser has made, current one included. Counted once per tab
 * via sessionStorage, so a prompt can wait until the user actually comes back.
 */
export function countVisit(): number {
	try {
		const previous = Number(localStorage.getItem(VISIT_COUNT_KEY)) || 0;
		if (sessionStorage.getItem(VISIT_FLAG_KEY)) return previous;

		const current = previous + 1;
		sessionStorage.setItem(VISIT_FLAG_KEY, '1');
		localStorage.setItem(VISIT_COUNT_KEY, String(current));
		return current;
	} catch {
		return 1;
	}
}
