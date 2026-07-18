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

/** Sliding window in-memory rate limiter. Per-pod: the effective limit scales with replica count — global limiting belongs at the Cloudflare edge. */
export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number
): RateLimitResult {
	cleanup();

	const now = Date.now();
	const entry = store.get(key);

	if (!entry || entry.resetAt <= now) {
		store.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
	}

	if (entry.count >= limit) {
		return { allowed: false, remaining: 0, resetAt: entry.resetAt };
	}

	entry.count++;
	return {
		allowed: true,
		remaining: limit - entry.count,
		resetAt: entry.resetAt,
	};
}
