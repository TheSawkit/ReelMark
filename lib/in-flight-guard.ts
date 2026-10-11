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

/** Collapses overlapping calls of a refresh so a burst of events costs two runs instead of one each; every caller's promise settles after a run that started after its call. */
export function coalesceInFlight(
	task: () => Promise<void>
): () => Promise<void> {
	let running: Promise<void> | null = null;
	let rerun = false;

	async function loop(): Promise<void> {
		await Promise.resolve();
		try {
			do {
				rerun = false;
				try {
					await task();
				} catch (error) {
					if (!rerun) throw error;
				}
			} while (rerun);
		} finally {
			running = null;
		}
	}

	return function run(): Promise<void> {
		if (running) {
			rerun = true;
			return running;
		}
		running = loop();
		return running;
	};
}
