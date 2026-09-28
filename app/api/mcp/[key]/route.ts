import { after } from 'next/server';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { resolveMcpKey, touchMcpKey } from '@/lib/data/mcp';
import { createReelMarkMcpServer } from '@/lib/mcp/server';
import { chargeMcpRequest } from '@/lib/mcp/budget';
import { mcpKeyAccess } from '@/lib/mcp/keys';
import { reportSwallowed } from '@/lib/report';

type Context = { params: Promise<{ key: string }> };

const WRITE_SCOPE = 'library:write';

/**
 * One handler for every link: each request still gets a fresh server from the factory, built for
 * the user and access the route resolved — handed over through `authInfo` (`clientId`, `scopes`),
 * the SDK's per-principal channel.
 */
const handler = createMcpHandler(
	({ authInfo }) =>
		createReelMarkMcpServer(
			authInfo!.clientId,
			authInfo!.scopes.includes(WRITE_SCOPE) ? 'write' : 'read'
		),
	{ onerror: (error) => reportSwallowed('mcp:handler', error) }
);

/** MCP endpoint of one user's AI link: the secret path segment is the credential and decides the access — read, or read and change title statuses in that user's library alone. */
async function handle(request: Request, { params }: Context) {
	const { key } = await params;
	const owner = await resolveMcpKey(key);
	if (!owner) return new Response(null, { status: 404 });

	const rejected = await chargeMcpRequest(owner.userId, request);
	if (rejected) return rejected;

	after(() => touchMcpKey(owner));
	return handler.fetch(request, {
		authInfo: {
			token: '',
			clientId: owner.userId,
			scopes: mcpKeyAccess(key) === 'write' ? [WRITE_SCOPE] : [],
		},
	});
}

/** POST only: the server is stateless, so GET (SSE stream) and DELETE (session end) would be 405 anyway — Next answers them before any key lookup or budget spend. */
export { handle as POST };
