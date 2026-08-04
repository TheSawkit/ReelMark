'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { parseVisibility } from '@/lib/privacy';
import { reportCritical } from '@/lib/report';
import { enforceUserRateLimit } from '@/lib/rate-limiter';
import { revalidateProfileAfterResponse } from '@/app/actions/_helpers';
import { VALID_STATUSES, validateRating } from '@/lib/validators';
import {
	RESOLVE_CONCURRENCY,
	mapLimit,
	resolveImportMedia,
} from '@/lib/data-transfer/resolve';
import type {
	ExportData,
	ImportBatchResult,
	ImportItem,
	ImportedList,
} from '@/lib/data-transfer/types';
import type { WatchStatus } from '@/types/tmdb';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

const EXPORT_LIMIT = 5;
const EXPORT_WINDOW_MS = 3_600_000;

type WatchlistRow = {
	user_id: string;
	media_id: number;
	media_type: 'movie' | 'tv';
	media_title: string;
	poster_path: string | null;
	status: WatchStatus;
};

/**
 * Full RGPD export of the authenticated user's data.
 * Rate-limited: one call dumps every watchlist, review and episode row the account owns.
 *
 * @throws Error('RATE_LIMITED') once the hourly export budget is exhausted.
 */
const MAX_BATCH_ITEMS = 50;
const MAX_BATCH_EPISODES = 5000;
const EPISODE_UPSERT_CHUNK = 1000;

export async function exportUserData(): Promise<ExportData> {
	const { supabase, userId } = await getAuthenticatedUser();

	enforceUserRateLimit('export', userId, EXPORT_LIMIT, EXPORT_WINDOW_MS);

	const [watchlistRows, reviewRows, episodeRows] = await Promise.all([
		fetchAllRows((from, to) =>
			supabase
				.from('watchlist')
				.select(
					'media_id,media_type,media_title,poster_path,status,created_at'
				)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.order('id')
				.range(from, to)
		),
		fetchAllRows((from, to) =>
			supabase
				.from('reviews')
				.select(
					'media_id,media_type,media_title,poster_path,rating,content,created_at'
				)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.order('id')
				.range(from, to)
		),
		fetchAllRows((from, to) =>
			supabase
				.from('episode_watches')
				.select('tv_id,season_number,episode_number,watched_at')
				.eq('user_id', userId)
				.order('id')
				.range(from, to)
		),
	]);

	return {
		version: 1,
		exported_at: new Date().toISOString(),
		watchlist: watchlistRows as ExportData['watchlist'],
		reviews: reviewRows as ExportData['reviews'],
		episode_watches: episodeRows as ExportData['episode_watches'],
	};
}

/**
 * Imports a batch of media items into the user's watchlist, resolving TMDB IDs in priority order:
 * direct TMDB ID → IMDb ID → TVDB ID → title+year search fallback.
 * "watched" entries upgrade existing "to_watch" ones; "to_watch" entries never downgrade "watched" ones.
 */
export async function importBatch(
	items: ImportItem[]
): Promise<ImportBatchResult> {
	if (!Array.isArray(items) || items.length === 0)
		return { imported: 0, failed: [] };
	if (items.length > MAX_BATCH_ITEMS)
		throw new Error(`Batch size exceeds limit (${MAX_BATCH_ITEMS})`);
	const totalEpisodes = items.reduce(
		(sum, item) => sum + (item.watchedEpisodes?.length ?? 0),
		0
	);
	if (totalEpisodes > MAX_BATCH_EPISODES)
		throw new Error(
			`Episode batch size exceeds limit (${MAX_BATCH_EPISODES})`
		);

	const { supabase, userId } = await getAuthenticatedUser();

	type Resolved = {
		row: WatchlistRow;
		rating: number | null;
		episodes: Array<{ season: number; episode: number }>;
	} | null;

	const resolved = await mapLimit(
		items,
		RESOLVE_CONCURRENCY,
		async (item): Promise<Resolved> => {
			try {
				const status = VALID_STATUSES.has(item.status)
					? item.status
					: 'watched';
				const rating = validateRating(item.rating);
				const validEpisodes = (item.watchedEpisodes ?? []).filter(
					(ep) =>
						Number.isInteger(ep.season) &&
						ep.season >= 1 &&
						Number.isInteger(ep.episode) &&
						ep.episode >= 1
				);

				const media = await resolveImportMedia(item);
				if (!media) return null;
				return {
					row: {
						user_id: userId,
						media_id: media.id,
						media_type: media.type,
						media_title: media.title,
						poster_path: media.poster_path,
						status,
					},
					rating,
					episodes: media.type === 'tv' ? validEpisodes : [],
				};
			} catch (error) {
				reportCritical('data-import:item', error);
				return null;
			}
		}
	);

	const hits = resolved.filter((r): r is NonNullable<Resolved> => r !== null);
	const rows = hits.map((h) => h.row);
	const failed = items
		.filter((_, i) => resolved[i] === null)
		.map((item) => item.title);

	if (rows.length === 0) return { imported: 0, failed };

	const watchedRows = rows.filter((r) => r.status === 'watched');
	const toWatchRows = rows.filter((r) => r.status === 'to_watch');

	const errors = await Promise.all([
		watchedRows.length > 0
			? supabase
					.from('watchlist')
					.upsert(watchedRows, {
						onConflict: ON_CONFLICT.watchlist,
					})
					.then((r) => r.error)
			: Promise.resolve(null),
		toWatchRows.length > 0
			? supabase
					.from('watchlist')
					.upsert(toWatchRows, {
						onConflict: ON_CONFLICT.watchlist,
						ignoreDuplicates: true,
					})
					.then((r) => r.error)
			: Promise.resolve(null),
	]);

	const error = errors.find(Boolean) ?? null;

	if (error) return { imported: 0, failed: items.map((i) => i.title) };

	const reviewRows = hits
		.filter((h) => h.rating !== null)
		.map((h) => ({
			user_id: userId,
			media_id: h.row.media_id,
			media_type: h.row.media_type,
			media_title: h.row.media_title,
			poster_path: h.row.poster_path,
			rating: h.rating,
			content: null,
		}));

	if (reviewRows.length > 0) {
		await supabase.from('reviews').upsert(reviewRows, {
			onConflict: ON_CONFLICT.reviews,
			ignoreDuplicates: true,
		});
	}

	const episodeRows = hits
		.filter((h) => h.row.media_type === 'tv' && h.episodes.length > 0)
		.flatMap((h) =>
			h.episodes.map((ep) => ({
				user_id: userId,
				tv_id: h.row.media_id,
				season_number: ep.season,
				episode_number: ep.episode,
			}))
		);
	for (let i = 0; i < episodeRows.length; i += EPISODE_UPSERT_CHUNK) {
		await supabase
			.from('episode_watches')
			.upsert(episodeRows.slice(i, i + EPISODE_UPSERT_CHUNK), {
				onConflict: ON_CONFLICT.episodeWatches,
				ignoreDuplicates: true,
			});
	}

	return { imported: rows.length, failed };
}

/**
 * Imports external lists as playlists: finds or creates each playlist by name, then
 * resolves items against TMDB and inserts them, skipping duplicates.
 */
export async function importLists(
	lists: ImportedList[]
): Promise<ImportBatchResult> {
	if (!Array.isArray(lists) || lists.length === 0)
		return { imported: 0, failed: [] };
	if (lists.length > 20) throw new Error('Too many lists (20 max)');

	const { supabase, userId, user } = await getAuthenticatedUser();

	const { data: privacyData } = await supabase
		.from('privacy_settings')
		.select('playlists_visibility')
		.eq('user_id', userId)
		.maybeSingle();
	const visibility = parseVisibility(
		privacyData?.playlists_visibility,
		'private'
	);

	let imported = 0;
	const failed: string[] = [];

	for (const list of lists) {
		const name = String(list.name ?? '')
			.trim()
			.slice(0, 100);
		if (!name) continue;
		const items = Array.isArray(list.items) ? list.items.slice(0, 200) : [];

		const resolved = await mapLimit(
			items,
			RESOLVE_CONCURRENCY,
			async (item) => resolveImportMedia(item).catch(() => null)
		);
		failed.push(
			...items.filter((_, i) => resolved[i] === null).map((i) => i.title)
		);

		const { data: existing } = await supabase
			.from('playlists')
			.select('id')
			.eq('user_id', userId)
			.eq('name', name)
			.maybeSingle();

		let playlistId = existing?.id ?? null;
		if (!playlistId) {
			const { data: created, error } = await supabase
				.from('playlists')
				.insert({
					user_id: userId,
					name,
					description: list.description
						? String(list.description).slice(0, 500)
						: null,
					visibility,
				})
				.select('id')
				.single();
			if (error || !created) {
				failed.push(
					...items
						.filter((_, i) => resolved[i] !== null)
						.map((i) => i.title)
				);
				continue;
			}
			playlistId = created.id;
		}

		const rows = resolved
			.filter((m): m is NonNullable<typeof m> => m !== null)
			.map((m) => ({
				playlist_id: playlistId,
				media_id: m.id,
				media_type: m.type,
				media_title: m.title,
				poster_path: m.poster_path,
			}));

		if (rows.length > 0) {
			const { error } = await supabase
				.from('playlist_items')
				.upsert(rows, {
					onConflict: ON_CONFLICT.playlistItems,
					ignoreDuplicates: true,
				});
			if (error) {
				failed.push(...rows.map((r) => r.media_title));
			} else {
				imported += rows.length;
			}
		}
	}

	revalidateProfileAfterResponse(supabase, user);
	return { imported, failed };
}
