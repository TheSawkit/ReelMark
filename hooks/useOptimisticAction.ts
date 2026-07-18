'use client';

import { useAsyncAction } from '@/hooks/useAsyncAction';

interface OptimisticRun<Result> {
	apply: () => void;
	rollback: () => void;
	action: () => Promise<Result>;
	onSuccess?: (result: Result) => void;
}

/** Runs a Server Action with an instant store update, rolling the store back when the action fails. */
export function useOptimisticAction() {
	const { loading, error, execute } = useAsyncAction();

	async function run<Result>({
		apply,
		rollback,
		action,
		onSuccess,
	}: OptimisticRun<Result>): Promise<void> {
		if (loading) return;
		apply();
		const result = await execute(action);
		if (result === undefined) {
			rollback();
			return;
		}
		onSuccess?.(result);
	}

	return { loading, error, run };
}
