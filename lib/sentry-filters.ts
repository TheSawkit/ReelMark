import type { ErrorEvent, EventHint } from '@sentry/nextjs';

const UPSTREAM_FAILURE =
	/^(TMDB API Error|Watchmode API Error|Service for this project is restricted)/;

function isPrerenderAbort(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'digest' in error &&
		error.digest === 'HANGING_PROMISE_REJECTION'
	);
}

/**
 * Server `beforeSend`: drops the rejection Next raises on dynamic APIs when it stops a prerender
 * (expected, absent from Next 16.3's well-known digests), and groups upstream API failures into
 * one issue per kind — Bugsink otherwise opens one per page URL.
 */
export function filterServerEvent(
	event: ErrorEvent,
	hint: EventHint
): ErrorEvent | null {
	if (isPrerenderAbort(hint.originalException)) return null;

	const value = event.exception?.values?.at(-1)?.value;
	if (value && UPSTREAM_FAILURE.test(value)) {
		event.fingerprint = ['upstream-api', value.replace(/\s*\(.*\)$/, '')];
	}
	return event;
}
