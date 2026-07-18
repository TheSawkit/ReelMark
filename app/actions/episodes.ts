'use server';

import {
	getAuthenticatedUser,
	getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import {
	SHARED_REVALIDATE_PATHS,
	revalidateLocalizedAfterResponse,
} from '@/app/actions/_helpers';
import { getCachedTvShowDetails } from '@/lib/tmdb/cached';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import type { WatchStatus } from '@/types/tmdb';

/** Watchlist status of a TV show after an episode change — 'none' when the show is not in the list. */
export type TvWatchlistStatus = WatchStatus | 'none';

export interface EpisodeWatchResult {
	watched: boolean;
	tvStatus: TvWatchlistStatus;
	addedToWatchlist: boolean;
}

/** Result of a season-wide write, carrying the pre-mutation state so the UI can offer an exact undo. */
export interface SeasonWatchResult extends EpisodeWatchResult {
	previousEpisodes: number[];
}

const MAX_SEASON_EPISODES = 5000;
const EPISODE_CONFLICT = 'user_id,tv_id,season_number,episode_number';

async function syncTvShowWatchlistStatus(
	supabase: SupabaseServerClient,
	userId: string,
	tvId: number
): Promise<TvWatchlistStatus> {
	const details = await getCachedTvShowDetails(tvId).catch(() => null);

	let totalEpisodes = (details?.seasons ?? [])
		.filter((s: { season_number: number }) => s.season_number > 0)
		.reduce(
			(sum: number, s: { episode_count: number }) =>
				sum + s.episode_count,
			0
		);

	if (totalEpisodes === 0) {
		const { data: entry } = await supabase
			.from('watchlist')
			.select('total_episodes')
			.eq('user_id', userId)
			.eq('media_id', tvId)
			.eq('media_type', 'tv')
			.maybeSingle();
		totalEpisodes = entry?.total_episodes ?? 0;
	}

	if (totalEpisodes === 0) {
		console.warn(
			'[episodes] Sync skipped for tvId:',
			tvId,
			'episode total unknown'
		);
		return readTvWatchlistStatus(supabase, userId, tvId);
	}

	const { error } = await supabase.rpc('sync_tv_watchlist_status', {
		p_tv_id: tvId,
		p_total: totalEpisodes,
		p_title: details?.name ?? undefined,
		p_poster: details?.poster_path ?? undefined,
	});
	if (error) {
		console.warn('[episodes] Sync failed for tvId:', tvId, error.message);
	}

	return readTvWatchlistStatus(supabase, userId, tvId);
}

async function readSeasonEpisodes(
	supabase: SupabaseServerClient,
	userId: string,
	tvId: number,
	seasonNumber: number
): Promise<number[]> {
	const { data } = await supabase
		.from('episode_watches')
		.select('episode_number')
		.eq('user_id', userId)
		.eq('tv_id', tvId)
		.eq('season_number', seasonNumber);

	return (data ?? []).map((row) => row.episode_number);
}

function assertEpisodeNumbers(episodeNumbers: number[]): void {
	if (
		!Array.isArray(episodeNumbers) ||
		episodeNumbers.length > MAX_SEASON_EPISODES ||
		episodeNumbers.some(
			(n) => !Number.isInteger(n) || n <= 0 || n > MAX_SEASON_EPISODES
		)
	) {
		throw new Error('Invalid episode numbers');
	}
}

async function readTvWatchlistStatus(
	supabase: SupabaseServerClient,
	userId: string,
	tvId: number
): Promise<TvWatchlistStatus> {
	const { data } = await supabase
		.from('watchlist')
		.select('status')
		.eq('user_id', userId)
		.eq('media_id', tvId)
		.eq('media_type', 'tv')
		.maybeSingle();

	return (data?.status as WatchStatus | undefined) ?? 'none';
}

/**
 * Sets the watched state of a single episode (idempotent) and syncs the parent
 * TV show's watchlist status atomically.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @param episodeNumber - Episode number within the season.
 * @param watched - Target state to persist.
 * @returns The applied state and the show's resulting watchlist status.
 */
export async function setEpisodeWatched(
	tvId: number,
	seasonNumber: number,
	episodeNumber: number,
	watched: boolean
): Promise<EpisodeWatchResult> {
	const { supabase, userId } = await getAuthenticatedUser();
	const previousStatus = await readTvWatchlistStatus(supabase, userId, tvId);

	if (watched) {
		const { error } = await supabase.from('episode_watches').upsert(
			{
				user_id: userId,
				tv_id: tvId,
				season_number: seasonNumber,
				episode_number: episodeNumber,
			},
			{ onConflict: EPISODE_CONFLICT, ignoreDuplicates: true }
		);
		if (error) throw new Error(error.message);
	} else {
		const { error } = await supabase
			.from('episode_watches')
			.delete()
			.eq('user_id', userId)
			.eq('tv_id', tvId)
			.eq('season_number', seasonNumber)
			.eq('episode_number', episodeNumber);
		if (error) throw new Error(error.message);
	}

	const tvStatus = await syncTvShowWatchlistStatus(supabase, userId, tvId);
	revalidateLocalizedAfterResponse(SHARED_REVALIDATE_PATHS);
	return {
		watched,
		tvStatus,
		addedToWatchlist: previousStatus === 'none' && tvStatus !== 'none',
	};
}

/**
 * Marks every episode from 1 to `upToEpisode` as watched (idempotent), letting a
 * user catch up on skipped episodes, and syncs the parent TV show's watchlist status.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @param upToEpisode - Highest episode number to mark, inclusive.
 * @returns The applied state and the show's resulting watchlist status.
 */
export async function setEpisodesWatchedUpTo(
	tvId: number,
	seasonNumber: number,
	upToEpisode: number
): Promise<SeasonWatchResult> {
	if (
		!Number.isInteger(upToEpisode) ||
		upToEpisode <= 0 ||
		upToEpisode > MAX_SEASON_EPISODES
	) {
		throw new Error('Invalid episode number');
	}

	const { supabase, userId } = await getAuthenticatedUser();
	const previousStatus = await readTvWatchlistStatus(supabase, userId, tvId);
	const previousEpisodes = await readSeasonEpisodes(
		supabase,
		userId,
		tvId,
		seasonNumber
	);

	const rows = Array.from({ length: upToEpisode }, (_, i) => ({
		user_id: userId,
		tv_id: tvId,
		season_number: seasonNumber,
		episode_number: i + 1,
	}));
	const { error } = await supabase
		.from('episode_watches')
		.upsert(rows, { onConflict: EPISODE_CONFLICT, ignoreDuplicates: true });
	if (error) throw new Error(error.message);

	const tvStatus = await syncTvShowWatchlistStatus(supabase, userId, tvId);
	revalidateLocalizedAfterResponse(SHARED_REVALIDATE_PATHS);
	return {
		watched: true,
		tvStatus,
		previousEpisodes,
		addedToWatchlist: previousStatus === 'none' && tvStatus !== 'none',
	};
}

/**
 * Replaces a season's watched episodes with exactly `episodeNumbers`, used to undo a
 * season-wide write without losing a partially watched state.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @param episodeNumbers - The exact set of episodes to leave marked as watched.
 * @returns The applied state and the show's resulting watchlist status.
 */
export async function setSeasonEpisodes(
	tvId: number,
	seasonNumber: number,
	episodeNumbers: number[]
): Promise<SeasonWatchResult> {
	assertEpisodeNumbers(episodeNumbers);

	const { supabase, userId } = await getAuthenticatedUser();
	const previousStatus = await readTvWatchlistStatus(supabase, userId, tvId);
	const previousEpisodes = await readSeasonEpisodes(
		supabase,
		userId,
		tvId,
		seasonNumber
	);

	const target = new Set(episodeNumbers);
	const surplus = previousEpisodes.filter(
		(episodeNumber) => !target.has(episodeNumber)
	);
	const missing = [...target].filter(
		(episodeNumber) => !previousEpisodes.includes(episodeNumber)
	);

	if (missing.length > 0) {
		const rows = missing.map((episodeNumber) => ({
			user_id: userId,
			tv_id: tvId,
			season_number: seasonNumber,
			episode_number: episodeNumber,
		}));
		const { error } = await supabase.from('episode_watches').upsert(rows, {
			onConflict: EPISODE_CONFLICT,
			ignoreDuplicates: true,
		});
		if (error) throw new Error(error.message);
	}

	if (surplus.length > 0) {
		const { error } = await supabase
			.from('episode_watches')
			.delete()
			.eq('user_id', userId)
			.eq('tv_id', tvId)
			.eq('season_number', seasonNumber)
			.in('episode_number', surplus);
		if (error) throw new Error(error.message);
	}

	const tvStatus = await syncTvShowWatchlistStatus(supabase, userId, tvId);
	revalidateLocalizedAfterResponse(SHARED_REVALIDATE_PATHS);
	return {
		watched: episodeNumbers.length > 0,
		tvStatus,
		previousEpisodes,
		addedToWatchlist: previousStatus === 'none' && tvStatus !== 'none',
	};
}

/**
 * Sets the watched state of a whole season (idempotent) and syncs the parent
 * TV show's watchlist status atomically.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @param totalEpisodes - Total number of episodes in the season.
 * @param watched - Target state to persist for every episode.
 * @returns The applied state and the show's resulting watchlist status.
 */
export async function setSeasonWatched(
	tvId: number,
	seasonNumber: number,
	totalEpisodes: number,
	watched: boolean
): Promise<SeasonWatchResult> {
	if (
		!Number.isInteger(totalEpisodes) ||
		totalEpisodes <= 0 ||
		totalEpisodes > MAX_SEASON_EPISODES
	) {
		throw new Error('Invalid episode count');
	}

	const { supabase, userId } = await getAuthenticatedUser();
	const previousStatus = await readTvWatchlistStatus(supabase, userId, tvId);
	const previousEpisodes = await readSeasonEpisodes(
		supabase,
		userId,
		tvId,
		seasonNumber
	);

	if (watched) {
		const rows = Array.from({ length: totalEpisodes }, (_, i) => ({
			user_id: userId,
			tv_id: tvId,
			season_number: seasonNumber,
			episode_number: i + 1,
		}));
		const { error } = await supabase.from('episode_watches').upsert(rows, {
			onConflict: EPISODE_CONFLICT,
			ignoreDuplicates: true,
		});
		if (error) throw new Error(error.message);
	} else {
		const { error } = await supabase
			.from('episode_watches')
			.delete()
			.eq('user_id', userId)
			.eq('tv_id', tvId)
			.eq('season_number', seasonNumber);
		if (error) throw new Error(error.message);
	}

	const tvStatus = await syncTvShowWatchlistStatus(supabase, userId, tvId);
	revalidateLocalizedAfterResponse(SHARED_REVALIDATE_PATHS);
	return {
		watched,
		tvStatus,
		previousEpisodes,
		addedToWatchlist: previousStatus === 'none' && tvStatus !== 'none',
	};
}

/**
 * Returns the set of watched episode numbers for a given season.
 * Returns an empty set for unauthenticated users.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @returns Set of watched episode numbers.
 */
export async function getSeasonEpisodeWatches(
	tvId: number,
	seasonNumber: number
): Promise<Set<number>> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId) return new Set();

	const { data: watches } = await supabase
		.from('episode_watches')
		.select('episode_number')
		.eq('user_id', userId)
		.eq('tv_id', tvId)
		.eq('season_number', seasonNumber);

	return new Set((watches ?? []).map((w) => w.episode_number));
}

export async function getTvShowWatchProgress(
	tvId: number
): Promise<Map<number, number>> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId) return new Map();

	const { data: watches } = await supabase
		.from('episode_watches')
		.select('season_number')
		.eq('user_id', userId)
		.eq('tv_id', tvId);

	const progress = new Map<number, number>();
	for (const w of watches ?? []) {
		progress.set(w.season_number, (progress.get(w.season_number) ?? 0) + 1);
	}
	return progress;
}

export async function getAllTvShowsWatchProgress(
	tvIds: number[]
): Promise<Record<number, number>> {
	if (tvIds.length === 0) return {};

	const { supabase, userId } = await getOptionalUser();
	if (!userId) return {};

	const { data: counts } = await supabase.rpc('episode_watch_counts');

	const wanted = new Set(tvIds);
	const totals: Record<number, number> = {};
	for (const row of counts ?? []) {
		if (wanted.has(row.tv_id)) totals[row.tv_id] = row.watched_count;
	}
	return totals;
}
