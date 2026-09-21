'use client';

import { useEffect } from 'react';
import { isStaleBuildError, recoverFromStaleBuild } from '@/lib/stale-build';

/**
 * Recovers tabs left open across a deployment. Serwist's `skipWaiting` + `clientsClaim`
 * (app/service-worker.ts) hand every open tab to the new service worker the moment it activates,
 * but the JS already running in that tab is unaffected — it keeps referencing the previous
 * build's hashed chunk paths. Those stop existing as soon as the old pods terminate, so the next
 * code-split import 404s and the React error boundary's "retry" button can't help: it re-renders
 * the same stale JS, which fails the same way every time. A hard reload is the only fix.
 */
export function StaleBuildRecovery() {
	useEffect(() => {
		function handleError(event: ErrorEvent) {
			if (isStaleBuildError(event.error ?? event.message)) {
				recoverFromStaleBuild();
			}
		}
		function handleRejection(event: PromiseRejectionEvent) {
			if (isStaleBuildError(event.reason)) recoverFromStaleBuild();
		}
		function handleControllerChange() {
			recoverFromStaleBuild();
		}

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleRejection);
		navigator.serviceWorker?.addEventListener(
			'controllerchange',
			handleControllerChange
		);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleRejection);
			navigator.serviceWorker?.removeEventListener(
				'controllerchange',
				handleControllerChange
			);
		};
	}, []);

	return null;
}
