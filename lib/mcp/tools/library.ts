import 'server-only';

import { z } from 'zod';
import {
	deleteWatchlistEntry,
	upsertWatchlistEntry,
} from '@/lib/data/watchlist-writes';
import { revalidateWatchlistPaths } from '@/lib/revalidate';
import { getMediaKey } from '@/lib/media';
import { fetchMediaDetails } from '@/lib/tmdb/media-endpoints';
import { toAssistantEntry } from '@/lib/mcp/format';
import {
	failure,
	json,
	mediaTypeSchema,
	orTitleNotFound,
	READ_ONLY,
	titleOf,
	tmdbIdSchema,
	type RegisterTools,
} from '@/lib/mcp/tools/shared';
import type { UserScope } from '@/lib/mcp/scope';
import type { MediaType, MovieDetails, TvShowDetails } from '@/types/tmdb';

const LIBRARY_CHANGES = ['to_watch', 'watched', 'abandoned', 'remove'] as const;
type LibraryChange = (typeof LIBRARY_CHANGES)[number];

async function applyLibraryChange(
	scope: UserScope,
	type: MediaType,
	id: number,
	change: LibraryChange
) {
	if (change === 'remove') {
		await deleteWatchlistEntry(scope.admin, scope.userId, id, type);
		return;
	}
	const { lang } = await scope.context();
	const details = await fetchMediaDetails<MovieDetails | TvShowDetails>(
		type,
		id,
		lang
	);
	await upsertWatchlistEntry(scope.admin, scope.userId, {
		mediaId: id,
		mediaType: type,
		mediaTitle: titleOf(details),
		posterPath: details.poster_path,
		status: change,
	});
}

export const registerLibraryTools: RegisterTools = (server, scope) => {
	server.registerTool(
		'get_watchlist',
		{
			title: 'Library',
			description:
				"The user's library, most recently added first: titles to watch, watched or abandoned, with their rating. Paginated.",
			inputSchema: z.object({
				type: mediaTypeSchema.optional(),
				status: z.enum(['to_watch', 'watched', 'abandoned']).optional(),
				offset: z.number().int().min(0).default(0),
				limit: z.number().int().min(1).max(100).default(50),
			}),
			annotations: READ_ONLY,
		},
		async ({ type, status, offset, limit }) => {
			const [taste, format] = await Promise.all([
				scope.taste(),
				scope.format(),
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

	server.registerTool(
		'update_library',
		{
			title: 'Update the library',
			description:
				"Marks a movie or series in the user's library as to watch, watched or abandoned (series only), or removes it from the library. Only call it when the user explicitly asks for that change. Returns the title's new state.",
			inputSchema: z.object({
				type: mediaTypeSchema,
				id: tmdbIdSchema,
				status: z
					.enum(LIBRARY_CHANGES)
					.describe(
						'"to_watch", "watched", "abandoned" (series only), or "remove" to take it out of the library'
					),
			}),
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ type, id, status }) => {
			if (status === 'abandoned' && type === 'movie') {
				return failure('Only a series can be abandoned.');
			}
			return orTitleNotFound(async () => {
				await applyLibraryChange(scope, type, id, status);
				scope.forgetTaste();
				revalidateWatchlistPaths(type, id);
				return json({
					id,
					type,
					status: status === 'remove' ? null : status,
					url: await scope.linkTo(type, id),
				});
			});
		}
	);
};
