import { checkRateLimit, retryAfterSeconds } from '@/lib/rate-limiter';

interface Budget {
	scope: string;
	limit: number;
	windowMs: number;
}

/** Every request — handshakes, `tools/list` and notifications cost no I/O, so this only stops floods. */
const REQUEST_BUDGETS: Budget[] = [
	{ scope: 'mcp-requests', limit: 120, windowMs: 60_000 },
];

/** Tool calls — the only requests that read Supabase and TMDB, so the only ones the real budget counts. */
const TOOL_BUDGETS: Budget[] = [
	{ scope: 'mcp-tools-minute', limit: 30, windowMs: 60_000 },
	{ scope: 'mcp-tools-day', limit: 100, windowMs: 86_400_000 },
];

/** Number of `tools/call` in a JSON-RPC body (one message or a batch); read from a clone, so the SDK still gets the body. */
export async function countToolCalls(request: Request): Promise<number> {
	try {
		const body: unknown = await request.clone().json();
		const messages: unknown[] = Array.isArray(body) ? body : [body];
		return messages.filter(
			(message) =>
				(message as { method?: unknown } | null)?.method ===
				'tools/call'
		).length;
	} catch {
		return 0;
	}
}

/** Spends `cost` units of each budget; returns when the first exhausted one resets, or null when all allow it. */
function spend(userId: string, budgets: Budget[], cost: number) {
	if (cost === 0) return null;
	for (const { scope, limit, windowMs } of budgets) {
		const { allowed, resetAt } = checkRateLimit(
			`${scope}:${userId}`,
			limit,
			windowMs,
			cost
		);
		if (!allowed) return resetAt;
	}
	return null;
}

/**
 * Charges one request to the user's budgets: always the flood guard, and the tool budgets once
 * per `tools/call` it carries.
 *
 * @returns The 429 to answer when a budget is exhausted, null otherwise.
 */
export async function chargeMcpRequest(
	userId: string,
	request: Request
): Promise<Response | null> {
	const resetAt =
		spend(userId, REQUEST_BUDGETS, 1) ??
		spend(userId, TOOL_BUDGETS, await countToolCalls(request));
	if (resetAt === null) return null;
	return new Response(null, {
		status: 429,
		headers: { 'Retry-After': retryAfterSeconds(resetAt) },
	});
}
