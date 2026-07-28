'use client';

import { useCallback, useRef, useTransition } from 'react';
import { createInFlightGuard } from '@/lib/in-flight-guard';

type GuardedTransition = [
	boolean,
	(action: () => Promise<void> | void) => void,
];

/**
 * useTransition whose startTransition drops re-entrant calls.
 * `disabled={isPending}` only reaches the DOM on the next render, so without this a
 * double click fires the same mutation twice — duplicate friend requests, duplicate playlists.
 */
export function useGuardedTransition(): GuardedTransition {
	const [isPending, startTransition] = useTransition();
	const guardRef = useRef<ReturnType<typeof createInFlightGuard>>(null);
	guardRef.current ??= createInFlightGuard();

	const start = useCallback((action: () => Promise<void> | void) => {
		const guard = guardRef.current;
		if (!guard || guard.busy) return;
		startTransition(() => guard.run(action));
	}, []);

	return [isPending, start];
}
