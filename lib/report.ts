import * as Sentry from '@sentry/nextjs';

/** Logs a swallowed fallback error with a stable tag so degraded paths stay visible in production logs. */
export function reportSwallowed(label: string, error: unknown): void {
	console.warn(`[${label}]`, error);
}

/** Logs and reports to Sentry an error on a critical path (data import/export, watchlist sync). */
export function reportCritical(label: string, error: unknown): void {
	console.error(`[${label}]`, error);
	Sentry.captureException(
		error instanceof Error
			? error
			: new Error(`[${label}] ${String(error)}`),
		{ tags: { label } }
	);
}
