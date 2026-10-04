import 'server-only';

import type { CallToolResult, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { isTMDBNotFound } from '@/lib/tmdb/errors';
import { MEDIA_TYPES } from '@/lib/validators';
import type { UserScope } from '@/lib/mcp/scope';
import type { MovieDetails, TvShowDetails } from '@/types/tmdb';

export type RegisterTools = (server: McpServer, scope: UserScope) => void;

export const mediaTypeSchema = z
	.enum(MEDIA_TYPES)
	.describe('"movie" for films, "tv" for series');

export const tmdbIdSchema = z.number().int().positive().describe('TMDB id');

export const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

export const json = (data: unknown): CallToolResult => ({
	content: [{ type: 'text', text: JSON.stringify(data) }],
});

export const failure = (message: string): CallToolResult => ({
	content: [{ type: 'text', text: message }],
	isError: true,
});

export const titleOf = (details: MovieDetails | TvShowDetails) =>
	'title' in details ? details.title : details.name;

/** Answers an id unknown to TMDB as a tool error the assistant can read, instead of a server failure. */
export async function orTitleNotFound(
	run: () => Promise<CallToolResult>
): Promise<CallToolResult> {
	try {
		return await run();
	} catch (error) {
		if (isTMDBNotFound(error)) return failure('Title not found.');
		throw error;
	}
}
