import 'server-only';

import type { CallToolResult, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { getMovieDetails, getTvShowDetails } from '@/lib/tmdb';
import { isTMDBNotFound } from '@/lib/tmdb/errors';
import type { UserScope } from '@/lib/mcp/scope';
import type { Language } from '@/lib/i18n/translations';
import type { MediaType, MovieDetails, TvShowDetails } from '@/types/tmdb';

export type RegisterTools = (server: McpServer, scope: UserScope) => void;

export const MEDIA_TYPES: MediaType[] = ['movie', 'tv'];

export const mediaTypeSchema = z
	.enum(['movie', 'tv'])
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

export function fetchTitleDetails(
	type: MediaType,
	id: number,
	lang: Language
): Promise<MovieDetails | TvShowDetails> {
	return type === 'movie'
		? getMovieDetails(id, lang)
		: getTvShowDetails(id, lang);
}

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
