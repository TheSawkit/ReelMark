import * as Sentry from '@sentry/nextjs';
import { unstable_rethrow } from 'next/navigation';
import { monotonicNowMs } from '@/lib/monotonic-now';

const FORWARD_DEDUP_MS = 5 * 60_000;
const lastForwardedAt = new Map<string, number>();

function shouldForward(key: string): boolean {
	const now = monotonicNowMs();
	const last = lastForwardedAt.get(key);
	if (last !== undefined && now - last < FORWARD_DEDUP_MS) return false;
	if (lastForwardedAt.size > 500) {
		for (const [k, t] of lastForwardedAt) {
			if (now - t > FORWARD_DEDUP_MS) lastForwardedAt.delete(k);
		}
	}
	lastForwardedAt.set(key, now);
	return true;
}

/**
 * Logs a swallowed fallback error with a stable tag and forwards it to Sentry as a
 * warning, deduped per label+message for 5 min so routine failures (dead TMDB ids,
 * quota cooldowns) surface without flooding. Next's own control-flow signals
 * (`redirect`, `notFound`, and the halt that stops a Cache Components prerender) are
 * rethrown instead — swallowing those would turn a redirect into a blank section.
 */
export function reportSwallowed(label: string, error: unknown): void {
	unstable_rethrow(error);
	console.warn(`[${label}]`, error);

	const message = error instanceof Error ? error.message : String(error);
	if (!shouldForward(`${label}:${message}`)) return;
	Sentry.captureException(
		error instanceof Error ? error : new Error(`[${label}] ${message}`),
		{ level: 'warning', tags: { label } }
	);
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
