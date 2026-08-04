'use client';

/** Listener bookkeeping every client store needs; `version` is the scalar snapshot `useSyncExternalStore` compares. */
export function createSubscription() {
	const listeners = new Set<() => void>();
	let version = 0;

	return {
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		notify() {
			version++;
			listeners.forEach((listener) => listener());
		},
		version: () => version,
	};
}

/** Shared Map + subscription plumbing for the client-side optimistic stores (media watch, episode watch, community rating). */
export function createKeyedStore<State>() {
	return { entries: new Map<string, State>(), ...createSubscription() };
}
