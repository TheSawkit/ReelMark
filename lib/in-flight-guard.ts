/** Serialises calls so a re-entrant one is dropped instead of queued; the dropped call resolves to undefined. */
export function createInFlightGuard() {
	let inFlight = false;

	return {
		get busy() {
			return inFlight;
		},
		async run<T>(action: () => Promise<T> | T): Promise<T | undefined> {
			if (inFlight) return undefined;
			inFlight = true;
			try {
				return await action();
			} finally {
				inFlight = false;
			}
		},
	};
}
