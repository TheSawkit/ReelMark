'use client';

import { useEffect } from 'react';
import { isStaleBuildError, recoverFromStaleBuild } from '@/lib/stale-build';

/** Reloads a tab whose lazy chunks vanished with the previous deployment; the error boundary's retry would replay the same stale JS. */
export function StaleBuildRecovery() {
	useEffect(() => {
		function handleError(event: ErrorEvent) {
			if (isStaleBuildError(event.error ?? event.message))
				recoverFromStaleBuild();
		}
		function handleRejection(event: PromiseRejectionEvent) {
			if (isStaleBuildError(event.reason)) recoverFromStaleBuild();
		}

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleRejection);
		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleRejection);
		};
	}, []);

	return null;
}
