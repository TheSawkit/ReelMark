'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAutoResetError } from '@/hooks/useAutoResetError';
import { isRedirectSignal } from '@/lib/action-errors';

interface ExecuteOptions {
	/** Toasted when the action fails — never when it redirected (signed out → login). */
	errorToast?: string;
}

interface UseAsyncActionResult {
	loading: boolean;
	error: boolean;
	execute: <T>(
		action: () => Promise<T>,
		options?: ExecuteOptions
	) => Promise<T | undefined>;
}

/**
 * Handles loading/error state for server action calls; re-entrant calls are dropped so rapid
 * clicks fire a single request. A redirect (an account-only action called signed out) is not an
 * error: the router is already navigating to login.
 */
export function useAsyncAction(): UseAsyncActionResult {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useAutoResetError();
	const inFlightRef = useRef(false);

	async function execute<T>(
		action: () => Promise<T>,
		{ errorToast }: ExecuteOptions = {}
	): Promise<T | undefined> {
		if (inFlightRef.current) return undefined;
		inFlightRef.current = true;
		setLoading(true);
		setError(false);
		try {
			return await action();
		} catch (err) {
			if (!isRedirectSignal(err)) {
				setError(true);
				if (errorToast) toast.error(errorToast);
			}
			return undefined;
		} finally {
			inFlightRef.current = false;
			setLoading(false);
		}
	}

	return { loading, error, execute };
}
