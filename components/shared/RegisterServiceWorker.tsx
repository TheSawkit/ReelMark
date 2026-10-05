'use client';

import { useEffect } from 'react';
import { reportSwallowed } from '@/lib/report';

declare global {
	interface Window {
		serwist?: { register(): Promise<unknown> };
	}
}

/**
 * Registers the service worker Serwist prepares (`register: false` in next.config.ts). Its own
 * auto-registration leaves the promise unhandled, and @serwist/window 9.5 rejects with a TypeError
 * (`registration.waiting` on undefined) when the browser refuses the worker.
 */
export function RegisterServiceWorker() {
	useEffect(() => {
		window.serwist
			?.register()
			.catch((error: unknown) => reportSwallowed('pwa:register', error));
	}, []);

	return null;
}
