import 'server-only';

import { McpServer, type CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { loadUserMarks, loadUserTaste, tasteOfType } from '@/lib/data/taste';
import { cachedUserTaste } from '@/lib/mcp/taste-cache';
import type { McpUserContext } from '@/lib/data/mcp';
import {
	pickSeeds,
	rankSuggestions,
	summarizeTaste,
	type SeedCandidates,
} from '@/lib/recommendations';
import { fetchSeedCandidates } from '@/lib/recommendations/candidates';
import {
	getGenres,
	getMovieDetails,
	getTvShowDetails,
	searchMulti,
} from '@/lib/tmdb';
import { fetchWatchProviders } from '@/lib/tmdb/media-endpoints';
import { isTMDBNotFound } from '@/lib/tmdb/errors';
import { getMediaKey } from '@/lib/media';
import { BASE_URL } from '@/lib/metadata';
import { localizedHref } from '@/lib/i18n/utils';
import {
	toAssistantDetails,
	toAssistantEntry,
	toAssistantTaste,
	toAssistantTitle,
	type AssistantFormat,
} from '@/lib/mcp/format';
import type { MediaItem, MediaType } from '@/types/tmdb';

const MEDIA_TYPES: MediaType[] = ['movie', 'tv'];
const MAX_RECOMMENDATION_PAGES = 3;
const MAX_SEARCH_RESULTS = 10;

const mediaType = z
	.enum(['movie', 'tv'])
	.describe('"movie" for films, "tv" for series');

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

const json = (data: unknown): CallToolResult => ({
	content: [{ type: 'text', text: JSON.stringify(data) }],
});

const failure = (message: string): CallToolResult => ({
	content: [{ type: 'text', text: message }],
	isError: true,
});

/** Builds the read-only ReelMark MCP server for one user: every tool answers from their library, never writes, and only returns titles that exist on TMDB. */
export function createReelMarkMcpServer({
	userId,
	lang,
	region,
}: McpUserContext): McpServer {
	const admin = createAdminClient();
	const userTaste = () =>
		cachedUserTaste(userId, () => loadUserTaste(admin, userId));
	const formatting = async (): Promise<AssistantFormat> => ({
		genres: await getGenres(lang),
		link: (type, id) =>
			`${BASE_URL}${localizedHref(lang, `/${type}/${id}`)}`,
	});

	const server = new McpServer(
		{ name: 'reelmark', version: '1.0.0' },
		{
			instructions:
				"ReelMark is the user's movie and TV tracker. Start with get_taste_profile to learn what they love and dislike, then use get_recommendations or search_titles to find candidates, and get_title for details and where to stream. Only recommend titles returned by these tools. Ratings use a 1–10 scale.",
		}
	);

	server.registerTool(
		'get_taste_profile',
		{
			title: 'Taste profile',
			description:
				"Summary of the user's tastes, per media type: favourite and disliked genres, average rating, best and worst rated titles, shows in progress, abandoned titles and library counts.",
			annotations: READ_ONLY,
		},
		async () => {
			const [taste, format] = await Promise.all([
				userTaste(),
				formatting(),
			]);
			return json(
				Object.fromEntries(
					MEDIA_TYPES.map((type) => [
						type,
						toAssistantTaste(
							summarizeTaste(
								tasteOfType(taste, type).entries,
								taste.profile
							),
							format
						),
					])
				)
			);
		}
	);

	server.registerTool(
		'get_recommendations',
		{
			title: 'Personal recommendations',
			description:
				'Titles ReelMark\'s engine recommends for this user, best first, built from what they watch and rate. Excludes everything already in their library or dismissed. Each item may say which title it is "because" of.',
			inputSchema: z.object({
				type: mediaType,
				limit: z.number().int().min(1).max(20).default(10),
			}),
			annotations: READ_ONLY,
		},
		async ({ type, limit }) => {
			const [taste, format] = await Promise.all([
				userTaste(),
				formatting(),
			]);
			const { entries, dismissals } = tasteOfType(taste, type);
			const seeds = pickSeeds(entries, taste.profile);
			if (seeds.length === 0) return json([]);

			const candidates: SeedCandidates[] = [];
			let ranked: MediaItem[] = [];
			for (
				let page = 1;
				page <= MAX_RECOMMENDATION_PAGES && ranked.length < limit;
				page++
			) {
				candidates.push(
					...(await fetchSeedCandidates(type, seeds, lang, page))
				);
				ranked = rankSuggestions(
					entries,
					taste.profile,
					dismissals,
					candidates
				);
			}
			return json(
				ranked
					.slice(0, limit)
					.map((item) => toAssistantTitle(item, format))
			);
		}
	);

	server.registerTool(
		'search_titles',
		{
			title: 'Search movies and series',
			description:
				"Searches the TMDB catalogue by title. Each result carries the user's status and rating when the title is in their library.",
			inputSchema: z.object({
				query: z.string().trim().min(1).max(200),
			}),
			annotations: READ_ONLY,
		},
		async ({ query }) => {
			const [results, format] = await Promise.all([
				searchMulti(query, 1, lang),
				formatting(),
			]);
			const items = results.slice(0, MAX_SEARCH_RESULTS);
			const marks = await loadUserMarks(admin, userId, items);
			return json(
				items.map((item) =>
					toAssistantTitle(item, format, marks.get(getMediaKey(item)))
				)
			);
		}
	);

	server.registerTool(
		'get_title',
		{
			title: 'Title details',
			description:
				"Full details of one movie or series: genres, runtime or seasons, synopsis, where to stream, rent or buy it in the user's region, and the user's own status and rating.",
			inputSchema: z.object({
				type: mediaType,
				id: z.number().int().positive().describe('TMDB id'),
			}),
			annotations: READ_ONLY,
		},
		async ({ type, id }) => {
			try {
				const [details, providers, marks, format] = await Promise.all([
					type === 'movie'
						? getMovieDetails(id, lang)
						: getTvShowDetails(id, lang),
					fetchWatchProviders(type, id, lang, region),
					loadUserMarks(admin, userId, [{ id, media_type: type }]),
					formatting(),
				]);
				return json(
					toAssistantDetails(
						details,
						type,
						providers,
						format,
						marks.get(getMediaKey({ media_type: type, id }))
					)
				);
			} catch (error) {
				if (isTMDBNotFound(error)) return failure('Title not found.');
				throw error;
			}
		}
	);

	server.registerTool(
		'get_watchlist',
		{
			title: 'Library',
			description:
				"The user's library, most recently added first: titles to watch, watched or abandoned, with their rating. Paginated.",
			inputSchema: z.object({
				type: mediaType.optional(),
				status: z.enum(['to_watch', 'watched', 'abandoned']).optional(),
				offset: z.number().int().min(0).default(0),
				limit: z.number().int().min(1).max(100).default(50),
			}),
			annotations: READ_ONLY,
		},
		async ({ type, status, offset, limit }) => {
			const [taste, format] = await Promise.all([
				userTaste(),
				formatting(),
			]);
			const matching = taste.entries
				.filter(
					(entry) =>
						(!type || entry.media_type === type) &&
						(!status || entry.status === status)
				)
				.sort((a, b) => b.created_at.localeCompare(a.created_at));
			return json({
				total: matching.length,
				items: matching.slice(offset, offset + limit).map((entry) =>
					toAssistantEntry(
						entry,
						format,
						taste.profile.ratings[
							getMediaKey({
								media_type: entry.media_type,
								id: entry.media_id,
							})
						]
					)
				),
			});
		}
	);

	return server;
}
