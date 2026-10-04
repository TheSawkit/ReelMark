import { RATE_LIMITED } from '@/lib/action-errors';

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
	lastCleanup = now;
	for (const [key, entry] of store) {
		if (entry.resetAt <= now) store.delete(key);
	}
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
}

/** Client IP for rate-limit keys — Cloudflare header first, spoofable fallbacks last. */
export function clientIpFrom(headers: Headers): string {
	return (
		headers.get('cf-connecting-ip') ??
		headers.get('x-forwarded-for')?.split(',')[0].trim() ??
		headers.get('x-real-ip') ??
		'unknown'
	);
}

/**
 * Sliding window in-memory rate limiter. Per-pod: the effective limit scales with replica count. The AI-assistant budget is shared through Postgres instead (`lib/mcp/budget.ts`); `/api/search` is also limited at the Cloudflare edge.
 *
 * @param cost - Units this call spends (a batch of several operations), all or nothing.
 */
export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number,
	cost = 1
): RateLimitResult {
	cleanup();

	const now = Date.now();
	const current = store.get(key);
	const entry =
		current && current.resetAt > now
			? current
			: { count: 0, resetAt: now + windowMs };

	if (entry.count + cost > limit) {
		return { allowed: false, remaining: 0, resetAt: entry.resetAt };
	}

	entry.count += cost;
	store.set(key, entry);
	return {
		allowed: true,
		remaining: limit - entry.count,
		resetAt: entry.resetAt,
	};
}

/** `Retry-After` value, in whole seconds, for a window that resets at `resetAt`. */
export function retryAfterSeconds(resetAt: number): string {
	return String(Math.ceil((resetAt - Date.now()) / 1000));
}

/**
 * Applies a per-user budget to an authenticated Server Action, keyed on the user rather
 * than the IP so shared NATs are not punished and IP rotation does not reset the window.
 *
 * @throws Error(RATE_LIMITED) once the budget for this scope is exhausted.
 */
export function enforceUserRateLimit(
	scope: string,
	userId: string,
	limit: number,
	windowMs: number
): void {
	const { allowed } = checkRateLimit(`${scope}:${userId}`, limit, windowMs);
	if (!allowed) throw new Error(RATE_LIMITED);
}
