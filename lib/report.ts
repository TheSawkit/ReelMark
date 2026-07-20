import * as Sentry from '@sentry/nextjs';
import { unstable_rethrow } from 'next/navigation';

/**
 * Logs a swallowed fallback error with a stable tag so degraded paths stay visible in
 * production logs. Next's own control-flow signals (`redirect`, `notFound`, and the halt
 * that stops a Cache Components prerender) are rethrown instead — swallowing those would
 * turn a redirect into a blank section.
 */
export function reportSwallowed(label: string, error: unknown): void {
	unstable_rethrow(error);
	console.warn(`[${label}]`, error);
}

/** Logs and reports to Sentry an error on a critical path (data import/export, watchlist sync). */
export function reportCritical(label: string, error: unknown): void {
	unstable_rethrow(error);
	console.error(`[${label}]`, error);
	Sentry.captureException(
		error instanceof Error
			? error
			: new Error(`[${label}] ${String(error)}`),
		{ tags: { label } }
	);
}
