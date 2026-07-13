'use client';

import { useRef, useState } from 'react';
import { useAutoResetError } from '@/hooks/useAutoResetError';

interface UseAsyncActionResult {
	loading: boolean;
	error: boolean;
	execute: <T>(action: () => Promise<T>) => Promise<T | undefined>;
}

/** Handles loading/error state for server action calls; re-entrant calls are dropped so rapid clicks fire a single request. */
export function useAsyncAction(): UseAsyncActionResult {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useAutoResetError();
	const inFlightRef = useRef(false);

	async function execute<T>(
		action: () => Promise<T>
	): Promise<T | undefined> {
		if (inFlightRef.current) return undefined;
		inFlightRef.current = true;
		setLoading(true);
		setError(false);
		try {
			return await action();
		} catch {
			setError(true);
			return undefined;
		} finally {
			inFlightRef.current = false;
			setLoading(false);
		}
	}

	return { loading, error, execute };
}
