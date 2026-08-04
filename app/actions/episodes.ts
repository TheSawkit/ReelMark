'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';
import {
	SHARED_REVALIDATE_PATHS,
	revalidateLocalizedAfterResponse,
} from '@/app/actions/_helpers';
import { getTvShowDetails } from '@/lib/tmdb/tv';
import { reportCritical, reportSwallowed } from '@/lib/report';
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

async function syncTvShowWatchlistStatus(
	supabase: SupabaseServerClient,
	userId: string,
	tvId: number
): Promise<TvWatchlistStatus> {
	const details = await getTvShowDetails(tvId).catch((error: unknown) => {
		reportSwallowed('episodes:tv-details', error);
		return null;
	});

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
		reportSwallowed(
			'episodes:sync-skipped',
			`episode total unknown for tvId ${tvId}`
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
		reportCritical(
			'episodes:sync',
			new Error(
				`sync_tv_watchlist_status failed for tvId ${tvId}: ${error.message}`
			)
		);
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
		episodeNumbers.some((n) => !isEpisodeNumber(n))
	) {
		throw new Error('Invalid episode numbers');
	}
}

function isEpisodeNumber(value: number): boolean {
	return Number.isInteger(value) && value > 0 && value <= MAX_SEASON_EPISODES;
}

function assertEpisodeNumber(value: number, message: string): void {
	if (!isEpisodeNumber(value)) throw new Error(message);
}

async function insertEpisodes(
	supabase: SupabaseServerClient,
	userId: string,
	tvId: number,
	seasonNumber: number,
	episodeNumbers: number[]
): Promise<void> {
	if (episodeNumbers.length === 0) return;

	const { error } = await supabase.from('episode_watches').upsert(
		episodeNumbers.map((episode_number) => ({
			user_id: userId,
			tv_id: tvId,
			season_number: seasonNumber,
			episode_number,
		})),
		{ onConflict: ON_CONFLICT.episodeWatches, ignoreDuplicates: true }
	);
	if (error) throw new Error(error.message);
}

/** Deletes the given episodes of a season, or the whole season when `episodeNumbers` is omitted. */
async function deleteEpisodes(
	supabase: SupabaseServerClient,
	userId: string,
	tvId: number,
	seasonNumber: number,
	episodeNumbers?: number[]
): Promise<void> {
	if (episodeNumbers?.length === 0) return;

	const query = supabase
		.from('episode_watches')
		.delete()
		.eq('user_id', userId)
		.eq('tv_id', tvId)
		.eq('season_number', seasonNumber);

	const { error } = await (episodeNumbers
		? query.in('episode_number', episodeNumbers)
		: query);
	if (error) throw new Error(error.message);
}

/**
 * Closes an episode write: re-syncs the show's watchlist status, defers revalidation, and
 * reports whether this write is what put the show in the watchlist — the UI refreshes only then.
 */
async function settleEpisodeWrite(
	supabase: SupabaseServerClient,
	userId: string,
	tvId: number,
	previousStatus: TvWatchlistStatus
): Promise<{ tvStatus: TvWatchlistStatus; addedToWatchlist: boolean }> {
	const tvStatus = await syncTvShowWatchlistStatus(supabase, userId, tvId);
	revalidateLocalizedAfterResponse(SHARED_REVALIDATE_PATHS);
	return {
		tvStatus,
		addedToWatchlist: previousStatus === 'none' && tvStatus !== 'none',
	};
}

const rangeUpTo = (last: number): number[] =>
	Array.from({ length: last }, (_, index) => index + 1);

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
		await insertEpisodes(supabase, userId, tvId, seasonNumber, [
			episodeNumber,
		]);
	} else {
		await deleteEpisodes(supabase, userId, tvId, seasonNumber, [
			episodeNumber,
		]);
	}

	return {
		watched,
		...(await settleEpisodeWrite(supabase, userId, tvId, previousStatus)),
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
	assertEpisodeNumber(upToEpisode, 'Invalid episode number');

	const { supabase, userId } = await getAuthenticatedUser();
	const previousStatus = await readTvWatchlistStatus(supabase, userId, tvId);
	const previousEpisodes = await readSeasonEpisodes(
		supabase,
		userId,
		tvId,
		seasonNumber
	);

	await insertEpisodes(
		supabase,
		userId,
		tvId,
		seasonNumber,
		rangeUpTo(upToEpisode)
	);

	return {
		watched: true,
		previousEpisodes,
		...(await settleEpisodeWrite(supabase, userId, tvId, previousStatus)),
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

	await insertEpisodes(supabase, userId, tvId, seasonNumber, missing);
	await deleteEpisodes(supabase, userId, tvId, seasonNumber, surplus);

	return {
		watched: episodeNumbers.length > 0,
		previousEpisodes,
		...(await settleEpisodeWrite(supabase, userId, tvId, previousStatus)),
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
	assertEpisodeNumber(totalEpisodes, 'Invalid episode count');

	const { supabase, userId } = await getAuthenticatedUser();
	const previousStatus = await readTvWatchlistStatus(supabase, userId, tvId);
	const previousEpisodes = await readSeasonEpisodes(
		supabase,
		userId,
		tvId,
		seasonNumber
	);

	if (watched) {
		await insertEpisodes(
			supabase,
			userId,
			tvId,
			seasonNumber,
			rangeUpTo(totalEpisodes)
		);
	} else {
		await deleteEpisodes(supabase, userId, tvId, seasonNumber);
	}

	return {
		watched,
		previousEpisodes,
		...(await settleEpisodeWrite(supabase, userId, tvId, previousStatus)),
	};
}
