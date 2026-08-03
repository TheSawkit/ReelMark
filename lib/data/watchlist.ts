import 'server-only';

import { cache } from 'react';
import { getOptionalUser } from '@/lib/supabase/auth-helpers';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns';
import { getAllTvShowsWatchProgress } from '@/lib/data/episodes';
import { getTvShowsTotalEpisodes } from '@/lib/tmdb';
import type { Language } from '@/lib/i18n/translations';
import { getMyReviewRatings } from '@/lib/data/reviews';
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
 * Ne lit que les deux colonnes de regroupement : compter deux mille lignes ne doit pas en
 * rapatrier les titres et les affiches.
 */
export const getWatchlistCounts = cache(async (): Promise<WatchlistCounts> => {
	const { supabase, userId } = await getOptionalUser();
	const counts = emptyCounts();
	if (!userId) return counts;

	const rows = await fetchAllRows<{ media_type: string; status: string }>(
		(from, to) =>
			supabase
				.from('watchlist')
				.select('media_type, status')
				.eq('user_id', userId)
				.order('id')
				.range(from, to)
	);

	for (const row of rows) {
		const byStatus = counts[row.media_type as MediaType];
		const status = row.status as WatchStatus;
		if (byStatus && status in byStatus) byStatus[status] += 1;
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

	const { data: entry } = await supabase
		.from('watchlist')
		.select(WATCHLIST_COLUMNS)
		.eq('user_id', userId)
		.eq('media_id', mediaId)
		.eq('media_type', mediaType)
		.maybeSingle();

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
export const getCachedMyRatings = cache(getMyReviewRatings);
export const getCachedDismissals = cache(getMyDismissals);
export const getCachedStreamingProviders = cache(getMyStreamingProviders);

/**
 * Loads the user's watchlist and per-show episode progress in one request-deduped call.
 * Argument-free so React.cache shares a single execution across all streamed sections.
 */
export const getWatchlistWithProgress = cache(
	async (): Promise<{
		watchlist: WatchlistEntry[];
		tvProgress: Record<number, number>;
	}> => {
		const watchlist = await getCachedUserWatchlist();
		const tvIds = watchlist
			.filter((e) => e.media_type === 'tv')
			.map((e) => e.media_id);
		const tvProgress = await getAllTvShowsWatchProgress(tvIds);
		return { watchlist, tvProgress };
	}
);

/**
 * Enriches media items with their watchlist entry using the request-cached full watchlist,
 * so concurrent streamed sections share a single Supabase read instead of one query each.
 */
export async function mergeWithWatchlist(
	items: MediaItem[]
): Promise<MediaItem[]> {
	if (items.length === 0) return [];
	const watchlist = await getCachedUserWatchlist();
	return items.map((item) => ({
		...item,
		watchlistEntry: watchlist.find(
			(entry) =>
				entry.media_id === item.id &&
				entry.media_type === item.media_type
		),
	}));
}
