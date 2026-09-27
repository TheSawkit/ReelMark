import { after } from 'next/server';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { resolveMcpKey, touchMcpKey } from '@/lib/data/mcp';
import { createReelMarkMcpServer } from '@/lib/mcp/server';
import { chargeMcpRequest } from '@/lib/mcp/budget';
import { reportSwallowed } from '@/lib/report';

type Context = { params: Promise<{ key: string }> };

/**
 * One handler for every link: each request still gets a fresh server from the factory, built for
 * the user the route resolved — handed over as `authInfo.clientId`, the SDK's per-principal channel.
 */
const handler = createMcpHandler(
	({ authInfo }) => createReelMarkMcpServer(authInfo!.clientId),
	{ onerror: (error) => reportSwallowed('mcp:handler', error) }
);

/** MCP endpoint of one user's AI link: the secret path segment is the credential, the tools only read. */
async function handle(request: Request, { params }: Context) {
	const { key } = await params;
	const owner = await resolveMcpKey(key);
	if (!owner) return new Response(null, { status: 404 });

	const rejected = await chargeMcpRequest(owner.userId, request);
	if (rejected) return rejected;

	after(() => touchMcpKey(owner));
	return handler.fetch(request, {
		authInfo: { token: '', clientId: owner.userId, scopes: [] },
	});
}

/** POST only: the server is stateless, so GET (SSE stream) and DELETE (session end) would be 405 anyway — Next answers them before any key lookup or budget spend. */
export { handle as POST };
