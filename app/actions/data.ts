'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { fetchTMDB } from '@/lib/tmdb/client';
import { searchMulti } from '@/lib/tmdb/search';
import { parseVisibility } from '@/lib/privacy';
import { revalidateProfileAfterResponse } from '@/app/actions/_helpers';
import {
	VALID_STATUSES,
	VALID_MEDIA_TYPES,
	validateRating,
} from '@/lib/validators';
import type { WatchStatus } from '@/types/tmdb';

interface TmdbVerified {
	type: 'movie' | 'tv';
	title: string;
	poster_path: string | null;
}

async function fetchTmdbForType(
	id: number,
	type: 'movie' | 'tv'
): Promise<TmdbVerified | null> {
	try {
		if (type === 'movie') {
			const data = await fetchTMDB<{
				title: string;
				poster_path: string | null;
			}>(`/movie/${id}`, {}, 86400);
			return {
				type: 'movie',
				title: data.title,
				poster_path: data.poster_path,
			};
		}
		const data = await fetchTMDB<{
			name: string;
			poster_path: string | null;
		}>(`/tv/${id}`, {}, 86400);
		return { type: 'tv', title: data.name, poster_path: data.poster_path };
	} catch (error) {
		if (error instanceof Error && error.message.includes('404'))
			return null;
		throw error;
	}
}

async function verifyTmdbType(
	id: number,
	expected: 'movie' | 'tv'
): Promise<TmdbVerified | null> {
	const primary = await fetchTmdbForType(id, expected);
	if (primary) return primary;
	return fetchTmdbForType(id, expected === 'movie' ? 'tv' : 'movie');
}

export interface ExportData {
	version: 1;
	exported_at: string;
	watchlist: Array<{
		media_id: number;
		media_type: string;
		media_title: string;
		poster_path: string | null;
		status: string;
		created_at: string;
	}>;
	reviews: Array<{
		media_id: number;
		media_type: string;
		media_title: string;
		poster_path: string | null;
		rating: number | null;
		content: string | null;
		created_at: string;
	}>;
	episode_watches: Array<{
		tv_id: number;
		season_number: number;
		episode_number: number;
		watched_at: string | null;
	}>;
}

export async function exportUserData(): Promise<ExportData> {
	const { supabase, userId } = await getAuthenticatedUser();

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

export interface ImportItem {
	title: string;
	year: number | null;
	status: WatchStatus;
	rating?: number | null;
	tmdbId?: number | null;
	imdbId?: string | null;
	tvdbId?: number | null;
	mediaType?: 'movie' | 'tv' | null;
	posterPath?: string | null;
	watchedEpisodes?: Array<{ season: number; episode: number }> | null;
}

export interface ImportBatchResult {
	imported: number;
	failed: string[];
}

interface FindResult {
	id: number;
	title: string;
	poster_path: string | null;
}

type WatchlistRow = {
	user_id: string;
	media_id: number;
	media_type: 'movie' | 'tv';
	media_title: string;
	poster_path: string | null;
	status: WatchStatus;
};

async function findByImdbId(
	imdbId: string,
	expectedType: 'movie' | 'tv'
): Promise<FindResult | null> {
	try {
		const data = await fetchTMDB<{
			movie_results: Array<{
				id: number;
				title: string;
				poster_path: string | null;
			}>;
			tv_results: Array<{
				id: number;
				name: string;
				poster_path: string | null;
			}>;
		}>(`/find/${imdbId}`, { external_source: 'imdb_id' }, 86400);

		if (expectedType === 'movie') {
			const r = data.movie_results[0];
			return r
				? { id: r.id, title: r.title, poster_path: r.poster_path }
				: null;
		}
		const r = data.tv_results[0];
		return r
			? { id: r.id, title: r.name, poster_path: r.poster_path }
			: null;
	} catch {
		return null;
	}
}

const RESOLVE_CONCURRENCY = 6;

async function mapLimit<T, R>(
	arr: T[],
	limit: number,
	fn: (item: T) => Promise<R>
): Promise<R[]> {
	const out = new Array<R>(arr.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(limit, arr.length) }, async () => {
			for (;;) {
				const i = next++;
				if (i >= arr.length) return;
				out[i] = await fn(arr[i]);
			}
		})
	);
	return out;
}

async function findByTvdbId(tvdbId: number): Promise<FindResult | null> {
	try {
		const data = await fetchTMDB<{
			tv_results: Array<{
				id: number;
				name: string;
				poster_path: string | null;
			}>;
		}>(`/find/${tvdbId}`, { external_source: 'tvdb_id' }, 86400);

		const r = data.tv_results[0];
		return r
			? { id: r.id, title: r.name, poster_path: r.poster_path }
			: null;
	} catch {
		return null;
	}
}

async function resolveImportMedia(item: ImportItem): Promise<{
	id: number;
	type: 'movie' | 'tv';
	title: string;
	poster_path: string | null;
} | null> {
	const mediaType: 'movie' | 'tv' =
		item.mediaType && VALID_MEDIA_TYPES.has(item.mediaType)
			? item.mediaType
			: 'movie';
	const fallbackTitle = String(item.title).slice(0, 500);

	if (item.tmdbId && Number.isInteger(item.tmdbId) && item.tmdbId > 0) {
		try {
			const verified = await verifyTmdbType(item.tmdbId, mediaType);
			if (!verified) return null;
			return {
				id: item.tmdbId,
				type: verified.type,
				title: verified.title || fallbackTitle,
				poster_path: verified.poster_path,
			};
		} catch {
			return {
				id: item.tmdbId,
				type: mediaType,
				title: fallbackTitle,
				poster_path: item.posterPath ?? null,
			};
		}
	}

	if (item.imdbId && /^tt\d+$/.test(item.imdbId)) {
		const found = await findByImdbId(item.imdbId, mediaType);
		if (found)
			return {
				id: found.id,
				type: mediaType,
				title: found.title,
				poster_path: found.poster_path,
			};
	}

	if (item.tvdbId && Number.isInteger(item.tvdbId) && item.tvdbId > 0) {
		const found = await findByTvdbId(item.tvdbId);
		if (found)
			return {
				id: found.id,
				type: 'tv',
				title: found.title,
				poster_path: found.poster_path,
			};
	}

	const results = await searchMulti(String(item.title).slice(0, 200));
	const candidates = item.mediaType
		? results.filter((r) => r.media_type === item.mediaType)
		: results;
	const match = item.year
		? (candidates.find((r) =>
				r.release_date?.startsWith(String(item.year))
			) ?? candidates[0])
		: candidates[0];

	if (!match) return null;
	return {
		id: match.id,
		type: match.media_type as 'movie' | 'tv',
		title: match.title || fallbackTitle,
		poster_path: match.poster_path,
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
	if (items.length > 50) throw new Error('Batch size exceeds limit (50)');
	const totalEpisodes = items.reduce(
		(sum, item) => sum + (item.watchedEpisodes?.length ?? 0),
		0
	);
	if (totalEpisodes > 5000)
		throw new Error('Episode batch size exceeds limit (5000)');

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
			} catch {
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
						onConflict: 'user_id,media_id,media_type',
					})
					.then((r) => r.error)
			: Promise.resolve(null),
		toWatchRows.length > 0
			? supabase
					.from('watchlist')
					.upsert(toWatchRows, {
						onConflict: 'user_id,media_id,media_type',
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
			onConflict: 'user_id,media_id,media_type',
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
	const EPISODE_UPSERT_CHUNK = 1000;
	for (let i = 0; i < episodeRows.length; i += EPISODE_UPSERT_CHUNK) {
		await supabase
			.from('episode_watches')
			.upsert(episodeRows.slice(i, i + EPISODE_UPSERT_CHUNK), {
				onConflict: 'user_id,tv_id,season_number,episode_number',
				ignoreDuplicates: true,
			});
	}

	return { imported: rows.length, failed };
}

export interface ImportedList {
	name: string;
	description: string | null;
	items: ImportItem[];
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
					onConflict: 'playlist_id,media_id,media_type',
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
