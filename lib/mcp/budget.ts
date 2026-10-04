import 'server-only';

import { checkRateLimit, retryAfterSeconds } from '@/lib/rate-limiter';
import { createAdminClient } from '@/lib/supabase/server';
import { reportSwallowed } from '@/lib/report';
import { z } from 'zod';

const jsonRpcMethod = z.object({ method: z.string() });

interface Budget {
	scope: string;
	limit: number;
	windowMs: number;
}

/** Every request — handshakes, `tools/list` and notifications cost no I/O, so this only stops floods, and this pod's counters suffice. */
const REQUEST_BUDGETS: Budget[] = [
	{ scope: 'mcp-requests', limit: 120, windowMs: 60_000 },
];

/**
 * Tool calls — the only requests that read Supabase and TMDB, so the only ones the real budget
 * counts, shared by every pod. 50 a day covers several conversations (5 to 15 calls each) and caps
 * a leaked or looping link at ~0.2 GB of egress a month on the 5 GB Free plan.
 */
const TOOL_BUDGETS: Budget[] = [
	{ scope: 'mcp-tools-minute', limit: 30, windowMs: 60_000 },
	{ scope: 'mcp-tools-day', limit: 50, windowMs: 86_400_000 },
];

/** Number of `tools/call` in a JSON-RPC body (one message or a batch); read from a clone, so the SDK still gets the body. */
export async function countToolCalls(request: Request): Promise<number> {
	try {
		const body: unknown = await request.clone().json();
		const messages: unknown[] = Array.isArray(body) ? body : [body];
		return messages.filter(
			(message) =>
				jsonRpcMethod.safeParse(message).data?.method === 'tools/call'
		).length;
	} catch {
		return 0;
	}
}

/** Spends `cost` units of each budget on this pod; returns when the first exhausted one resets, or null when all allow it. */
function spendLocal(userId: string, budgets: Budget[], cost: number) {
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
 * Spends `cost` units of every budget at once in Postgres, so the limit holds across pods: all or
 * nothing, and returns when the first exhausted window resets, or null when all allow it. Falls back
 * to this pod's counters when the database does not answer — the limit then applies per pod.
 */
async function spendShared(userId: string, budgets: Budget[], cost: number) {
	if (cost === 0) return null;
	try {
		const { data, error } = await createAdminClient().rpc(
			'consume_rate_limits',
			{
				p_keys: budgets.map(({ scope }) => `${scope}:${userId}`),
				p_limits: budgets.map(({ limit }) => limit),
				p_window_seconds: budgets.map(
					({ windowMs }) => windowMs / 1000
				),
				p_cost: cost,
			}
		);
		if (error) throw error;
		return data ? Date.parse(data) : null;
	} catch (error) {
		reportSwallowed('mcp:budget', error);
		return spendLocal(userId, budgets, cost);
	}
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
		spendLocal(userId, REQUEST_BUDGETS, 1) ??
		(await spendShared(
			userId,
			TOOL_BUDGETS,
			await countToolCalls(request)
		));
	if (resetAt === null) return null;
	return new Response(null, {
		status: 429,
		headers: { 'Retry-After': retryAfterSeconds(resetAt) },
	});
}
