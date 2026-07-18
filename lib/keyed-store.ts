'use client';

/** Shared Map + subscription plumbing for the client-side optimistic stores (media watch, episode watch, community rating). */
export function createKeyedStore<State>() {
	const entries = new Map<string, State>();
	const listeners = new Set<() => void>();
	let version = 0;

	function notify() {
		version++;
		listeners.forEach((listener) => listener());
	}

	function subscribe(listener: () => void) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}

	return { entries, notify, subscribe, version: () => version };
}
