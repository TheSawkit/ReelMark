import { after } from 'next/server';
import { createMcpHandler } from '@modelcontextprotocol/server';
import {
	getMcpUserContext,
	resolveMcpKey,
	touchMcpKey,
	type McpUserContext,
} from '@/lib/data/mcp';
import { createReelMarkMcpServer } from '@/lib/mcp/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { reportSwallowed } from '@/lib/report';

const BUDGETS = [
	{ scope: 'mcp-minute', limit: 30, windowMs: 60_000 },
	{ scope: 'mcp-day', limit: 100, windowMs: 86_400_000 },
] as const;

type Context = { params: Promise<{ key: string }> };

/**
 * One handler for every link: each request still gets a fresh server from the factory, built for
 * the user the route resolved — handed over through `authInfo`, the SDK's per-principal channel.
 */
const handler = createMcpHandler(
	({ authInfo }) =>
		createReelMarkMcpServer(authInfo?.extra?.context as McpUserContext),
	{ onerror: (error) => reportSwallowed('mcp:handler', error) }
);

/** MCP endpoint of one user's AI link: the secret path segment is the credential, the tools only read. */
async function handle(request: Request, { params }: Context) {
	const { key } = await params;
	const owner = await resolveMcpKey(key);
	if (!owner) return new Response(null, { status: 404 });

	for (const { scope, limit, windowMs } of BUDGETS) {
		const { allowed, resetAt } = checkRateLimit(
			`${scope}:${owner.userId}`,
			limit,
			windowMs
		);
		if (!allowed) {
			return new Response(null, {
				status: 429,
				headers: {
					'Retry-After': String(
						Math.ceil((resetAt - Date.now()) / 1000)
					),
				},
			});
		}
	}

	const context = await getMcpUserContext(owner.userId);
	after(() => touchMcpKey(owner));
	return handler.fetch(request, {
		authInfo: {
			token: '',
			clientId: owner.userId,
			scopes: [],
			extra: { context },
		},
	});
}

/** POST only: the server is stateless, so GET (SSE stream) and DELETE (session end) would be 405 anyway — Next answers them before any key lookup or budget spend. */
export { handle as POST };
