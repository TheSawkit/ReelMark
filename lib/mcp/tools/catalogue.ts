import 'server-only';

import { z } from 'zod';
import { loadUserMarks } from '@/lib/data/taste';
import { searchMulti } from '@/lib/tmdb';
import { fetchWatchProviders } from '@/lib/tmdb/media-endpoints';
import { getMediaKey } from '@/lib/media';
import { toAssistantDetails, toAssistantTitle } from '@/lib/mcp/format';
import {
	fetchTitleDetails,
	json,
	mediaTypeSchema,
	orTitleNotFound,
	READ_ONLY,
	tmdbIdSchema,
	type RegisterTools,
} from '@/lib/mcp/tools/shared';

const MAX_SEARCH_RESULTS = 10;

export const registerCatalogueTools: RegisterTools = (server, scope) => {
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
			const { lang } = await scope.context();
			const [results, format] = await Promise.all([
				searchMulti(query, 1, lang),
				scope.format(),
			]);
			const items = results.slice(0, MAX_SEARCH_RESULTS);
			const marks = await loadUserMarks(scope.admin, scope.userId, items);
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
			inputSchema: z.object({ type: mediaTypeSchema, id: tmdbIdSchema }),
			annotations: READ_ONLY,
		},
		async ({ type, id }) => {
			const { lang, region } = await scope.context();
			return orTitleNotFound(async () => {
				const [details, providers, marks, format] = await Promise.all([
					fetchTitleDetails(type, id, lang),
					fetchWatchProviders(type, id, lang, region),
					loadUserMarks(scope.admin, scope.userId, [
						{ id, media_type: type },
					]),
					scope.format(),
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
			});
		}
	);
};
