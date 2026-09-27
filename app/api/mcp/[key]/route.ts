import { after } from 'next/server';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { getMcpUserContext, resolveMcpKey, touchMcpKey } from '@/lib/data/mcp';
import { createReelMarkMcpServer } from '@/lib/mcp/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { reportSwallowed } from '@/lib/report';

const BUDGETS = [
	{ scope: 'mcp-minute', limit: 30, windowMs: 60_000 },
	{ scope: 'mcp-day', limit: 100, windowMs: 86_400_000 },
] as const;

type Context = { params: Promise<{ key: string }> };

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
	const handler = createMcpHandler(() => createReelMarkMcpServer(context), {
		responseMode: 'json',
		onerror: (error) => reportSwallowed('mcp:handler', error),
	});
	after(() => Promise.all([touchMcpKey(owner), handler.close()]));
	return handler.fetch(request);
}

export { handle as GET, handle as POST, handle as DELETE };
