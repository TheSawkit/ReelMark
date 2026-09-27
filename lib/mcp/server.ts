import 'server-only';

import { McpServer } from '@modelcontextprotocol/server';
import { createUserScope } from '@/lib/mcp/scope';
import { registerTasteTools } from '@/lib/mcp/tools/taste';
import { registerRecommendationTools } from '@/lib/mcp/tools/recommendations';
import { registerCatalogueTools } from '@/lib/mcp/tools/catalogue';
import { registerLibraryTools } from '@/lib/mcp/tools/library';

const INSTRUCTIONS =
	"ReelMark is the user's movie and TV tracker. Start with get_taste_profile to learn what they love and dislike, then use get_recommendations or search_titles to find candidates, and get_title for details and where to stream. Only recommend titles returned by these tools. Ratings use a 1–10 scale. Use update_library only when the user explicitly asks to mark a title as watched, to watch or abandoned, or to remove it — find its id with search_titles first.";

const TOOL_GROUPS = [
	registerTasteTools,
	registerRecommendationTools,
	registerCatalogueTools,
	registerLibraryTools,
];

/**
 * Builds the ReelMark MCP server for one user: every tool answers from their library and only
 * returns titles that exist on TMDB; `update_library` is the single write, limited to that
 * user's library. Nothing loads until a tool runs, so handshakes and `tools/list` cost no I/O.
 */
export function createReelMarkMcpServer(userId: string): McpServer {
	const server = new McpServer(
		{ name: 'reelmark', version: '1.0.0' },
		{ instructions: INSTRUCTIONS }
	);
	const scope = createUserScope(userId);
	for (const registerTools of TOOL_GROUPS) registerTools(server, scope);
	return server;
}
