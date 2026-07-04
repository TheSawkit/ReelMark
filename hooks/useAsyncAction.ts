'use client';

import { useState } from 'react';
import { useAutoResetError } from '@/hooks/useAutoResetError';

interface UseAsyncActionResult {
	loading: boolean;
	error: boolean;
	execute: <T>(action: () => Promise<T>) => Promise<T | undefined>;
}

/** Handles loading/error state for server action calls; UI updates come from the action's own revalidatePath. */
export function useAsyncAction(): UseAsyncActionResult {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useAutoResetError();

	async function execute<T>(
		action: () => Promise<T>
	): Promise<T | undefined> {
		setLoading(true);
		setError(false);
		try {
			return await action();
		} catch {
			setError(true);
			return undefined;
		} finally {
			setLoading(false);
		}
	}

	return { loading, error, execute };
}
