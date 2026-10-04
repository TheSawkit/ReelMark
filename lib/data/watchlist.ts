import 'server-only';

import { cache } from 'react';
import { getOptionalUser } from '@/lib/supabase/auth-helpers';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns';
import {
	getAllTvShowsWatchProgress,
	getMyTvProgress,
} from '@/lib/data/episodes';
import { getTvShowsTotalEpisodes } from '@/lib/tmdb';
import { getMediaKey } from '@/lib/media';
import { reportSwallowed } from '@/lib/report';
import type { Language } from '@/lib/i18n/translations';
import { getMyReviewSignals } from '@/lib/data/reviews';
import {
	getMyDismissals,
	getMyStreamingProviders,
} from '@/lib/data/recommendations';
import type {
	MediaItem,
	MediaType,
	WatchStatus,
	WatchlistEntry,
} from '@/types/tmdb';

/** Every watchlist row of the authenticated user, newest first; empty when signed out. */
export async function getUserWatchlist(): Promise<WatchlistEntry[]> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId) return [];

	const entries = await fetchAllRows((from, to) =>
		supabase
			.from('watchlist')
			.select(WATCHLIST_COLUMNS)
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.order('id')
			.range(from, to)
	);

	return entries as WatchlistEntry[];
}

export type WatchlistCounts = Record<MediaType, Record<WatchStatus, number>>;

function emptyCounts(): WatchlistCounts {
	const zero = () => ({ to_watch: 0, watched: 0, abandoned: 0 });
	return { movie: zero(), tv: zero() };
}

/**
 * Combien de titres l'utilisateur possède, par type et par statut.
 * Compté en base (`watchlist_counts`) : au plus six lignes traversent le réseau, là où la
 * version précédente rapatriait toute la bibliothèque par pages de 1000 pour la compter en JS.
 */
export const getWatchlistCounts = cache(async (): Promise<WatchlistCounts> => {
	const { supabase, userId } = await getOptionalUser();
	const counts = emptyCounts();
	if (!userId) return counts;

	const { data, error } = await supabase.rpc('watchlist_counts');
	if (error) throw new Error(error.message);

	for (const row of data ?? []) {
		const byStatus = counts[row.media_type as MediaType];
		const status = row.status as WatchStatus;
		if (byStatus && status in byStatus)
			byStatus[status] = Number(row.count);
	}
	return counts;
});

/**
 * Combien d'entrées un aller-retour ramène. Un compartiment de plusieurs milliers de titres
 * mettait deux secondes à revenir d'un bloc — découpé, le premier lot s'affiche tout de suite
 * et les suivants s'ajoutent sans bloquer.
 */
export const LIBRARY_PAGE_SIZE = 500;

/**
 * Un lot d'un compartiment, le plus récent d'abord.
 * `/library` n'affiche qu'un compartiment à la fois : les envoyer tous, entiers, revenait à
 * sérialiser 2 077 entrées pour en montrer 316.
 */
export async function getWatchlistBucket(
	mediaType: MediaType,
	status: WatchStatus,
	page = 0
): Promise<WatchlistEntry[]> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId) return [];

	const from = page * LIBRARY_PAGE_SIZE;

	const { data, error } = await supabase
		.from('watchlist')
		.select(WATCHLIST_COLUMNS)
		.eq('user_id', userId)
		.eq('media_type', mediaType)
		.eq('status', status)
		.order('created_at', { ascending: false })
		.order('id')
		.range(from, from + LIBRARY_PAGE_SIZE - 1);

	if (error) throw new Error(error.message);

	return (data ?? []) as WatchlistEntry[];
}

/**
 * Un compartiment prêt à afficher : ses entrées, et pour les séries la progression par titre.
 * Le total d'épisodes vient de la ligne de watchlist quand il y est, de TMDB sinon — toutes
 * les lignes ne sont pas encore remplies par le backfill.
 */
export async function getWatchlistBucketWithProgress(
	mediaType: MediaType,
	status: WatchStatus,
	lang?: Language,
	page = 0
): Promise<{
	entries: WatchlistEntry[];
	tvProgress: Record<number, { watched: number; total: number }>;
	hasMore: boolean;
}> {
	const entries = await getWatchlistBucket(mediaType, status, page);
	const hasMore = entries.length === LIBRARY_PAGE_SIZE;

	if (mediaType !== 'tv' || entries.length === 0) {
		return { entries, tvProgress: {}, hasMore };
	}

	const stored: Record<number, number> = {};
	const missing: number[] = [];
	for (const entry of entries) {
		if (typeof entry.total_episodes === 'number') {
			stored[entry.media_id] = entry.total_episodes;
		} else {
			missing.push(entry.media_id);
		}
	}

	const tvIds = entries.map((entry) => entry.media_id);
	const [watchedCounts, fetched] = await Promise.all([
		getAllTvShowsWatchProgress(tvIds),
		missing.length > 0
			? getTvShowsTotalEpisodes(missing, lang)
			: Promise.resolve<Record<number, number>>({}),
	]);

	const tvProgress: Record<number, { watched: number; total: number }> = {};
	for (const tvId of tvIds) {
		tvProgress[tvId] = {
			watched: watchedCounts[tvId] ?? 0,
			total: stored[tvId] ?? fetched[tvId] ?? 0,
		};
	}

	return { entries, tvProgress, hasMore };
}

/** The authenticated user's watchlist row for one title, or null when absent. */
export async function getMediaWatchlistEntry(
	mediaId: number,
	mediaType: MediaType
): Promise<WatchlistEntry | null> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId) return null;

	const { data: entry, error: entryError } = await supabase
		.from('watchlist')
		.select(WATCHLIST_COLUMNS)
		.eq('user_id', userId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType)
		.maybeSingle();
	if (entryError) reportSwallowed('watchlist:entry', entryError);

	return (entry as WatchlistEntry) ?? null;
}

/** Watchlist rows for a batch of TMDB IDs, so a grid can badge its cards in one query. */
export async function getMediaWatchlistEntries(
	mediaIds: number[]
): Promise<WatchlistEntry[]> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId || mediaIds.length === 0) return [];

	const { data: entries, error } = await supabase
		.from('watchlist')
		.select(WATCHLIST_COLUMNS)
		.eq('user_id', userId)
		.in('media_id', mediaIds);

	if (error) throw new Error(error.message);

	return (entries as WatchlistEntry[]) ?? [];
}

export const getCachedUserWatchlist = cache(getUserWatchlist);
export const getCachedMyReviewSignals = cache(getMyReviewSignals);
export const getCachedDismissals = cache(getMyDismissals);
export const getCachedStreamingProviders = cache(getMyStreamingProviders);

/**
 * Loads the user's watchlist and per-show episode progress in one request-deduped call.
 * Argument-free so React.cache shares a single execution across all streamed sections.
 * `lastWatchedAt` rides along for the "continue watching" ordering, which used to cost its own
 * round-trip.
 */
export const getWatchlistWithProgress = cache(
	async (): Promise<{
		watchlist: WatchlistEntry[];
		tvProgress: Record<number, number>;
		lastWatchedAt: Map<number, string>;
	}> => {
		const watchlist = await getCachedUserWatchlist();
		const tvIds = watchlist
			.filter((e) => e.media_type === 'tv')
			.map((e) => e.media_id);
		const { watched, lastWatchedAt } = await getMyTvProgress(tvIds);
		return { watchlist, tvProgress: watched, lastWatchedAt };
	}
);

/** Ids per `.in()` query: two rows at most per id (a movie and a show can share one), so a chunk can never reach PostgREST's 1000-row cap. */
const ENTRY_IDS_PER_QUERY = 300;

/**
 * Coalesces the watchlist lookups of one request. Streamed sections resolve at nearly the same
 * time; each asks for its own ids, and the loader answers all of them with one query issued on
 * the next tick, never asking twice for an id it already knows.
 *
 * @param fetchEntries - Reads the viewer's rows for a set of TMDB ids.
 * @returns A function resolving the entries of the requested ids (both media types).
 */
export function createWatchlistEntryLoader(
	fetchEntries: (mediaIds: number[]) => Promise<WatchlistEntry[]>
): (mediaIds: number[]) => Promise<WatchlistEntry[]> {
	const known = new Map<number, Promise<WatchlistEntry[]>>();
	let batch: {
		ids: Set<number>;
		result: Promise<Map<number, WatchlistEntry[]>>;
	} | null = null;

	function enqueue(mediaId: number): Promise<WatchlistEntry[]> {
		if (!batch) {
			const ids = new Set<number>();
			const result = new Promise<Map<number, WatchlistEntry[]>>(
				(resolve, reject) => {
					setTimeout(() => {
						batch = null;
						fetchEntries([...ids]).then((entries) => {
							const byId = new Map<number, WatchlistEntry[]>();
							for (const entry of entries) {
								const list = byId.get(entry.media_id) ?? [];
								list.push(entry);
								byId.set(entry.media_id, list);
							}
							resolve(byId);
						}, reject);
					}, 0);
				}
			);
			batch = { ids, result };
		}
		batch.ids.add(mediaId);
		return batch.result.then((byId) => byId.get(mediaId) ?? []);
	}

	return async (mediaIds) => {
		const lists = await Promise.all(
			[...new Set(mediaIds)].map((mediaId) => {
				let entries = known.get(mediaId);
				if (!entries) {
					entries = enqueue(mediaId);
					known.set(mediaId, entries);
				}
				return entries;
			})
		);
		return lists.flat();
	};
}

/** The request's loader, bound to the signed-in viewer; one per request through `cache()`. */
const getRequestEntryLoader = cache(() =>
	createWatchlistEntryLoader(async (mediaIds) => {
		const chunks: number[][] = [];
		for (let i = 0; i < mediaIds.length; i += ENTRY_IDS_PER_QUERY)
			chunks.push(mediaIds.slice(i, i + ENTRY_IDS_PER_QUERY));
		const results = await Promise.all(chunks.map(getMediaWatchlistEntries));
		return results.flat();
	})
);

/**
 * Enriches media items with their watchlist entry.
 *
 * Only the displayed titles are looked up — the full library was downloaded here before, all
 * 2 000+ rows (~600 KB) to badge a row of twenty cards, on every detail, crew, explorer and
 * search page: the single largest source of Supabase egress. Pass `watchlist` when the caller
 * already holds the full list (dashboard) to skip the lookup altogether.
 *
 * A failed lookup leaves the cards unbadged instead of failing the section.
 */
export async function mergeWithWatchlist(
	items: MediaItem[],
	watchlist?: readonly WatchlistEntry[]
): Promise<MediaItem[]> {
	if (items.length === 0) return [];

	let entries: readonly WatchlistEntry[];
	if (watchlist) {
		entries = watchlist;
	} else {
		const { userId } = await getOptionalUser();
		if (!userId) return items;
		entries = await getRequestEntryLoader()(
			items.map((item) => item.id)
		).catch((error: unknown) => {
			reportSwallowed('watchlist:merge', error);
			return [];
		});
	}

	const byKey = new Map(
		entries.map((entry) => [
			getMediaKey({ media_type: entry.media_type, id: entry.media_id }),
			entry,
		])
	);
	return items.map((item) => ({
		...item,
		watchlistEntry: byKey.get(getMediaKey(item)),
	}));
}
