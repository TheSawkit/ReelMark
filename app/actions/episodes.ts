'use server';

import { unstable_cache } from 'next/cache';
import {
	getAuthenticatedUser,
	getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import {
	SHARED_REVALIDATE_PATHS,
	revalidateLocalized,
} from '@/app/actions/_helpers';
import { getTvShowDetails } from '@/lib/tmdb';
import type { SupabaseServerClient } from '@/lib/supabase/server';

const getCachedTvShowDetails = unstable_cache(
	(tvId: number) => getTvShowDetails(tvId),
	['tv-show-details'],
	{ revalidate: 300 }
);

const MAX_SEASON_EPISODES = 5000;
const EPISODE_CONFLICT = 'user_id,tv_id,season_number,episode_number';

async function syncTvShowWatchlistStatus(
	supabase: SupabaseServerClient,
	userId: string,
	tvId: number
) {
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
		return;
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
}

/**
 * Sets the watched state of a single episode (idempotent) and syncs the parent
 * TV show's watchlist status atomically.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @param episodeNumber - Episode number within the season.
 * @param watched - Target state to persist.
 * @returns The applied state, echoing `watched`.
 */
export async function setEpisodeWatched(
	tvId: number,
	seasonNumber: number,
	episodeNumber: number,
	watched: boolean
): Promise<boolean> {
	const { supabase, userId } = await getAuthenticatedUser();

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

	await syncTvShowWatchlistStatus(supabase, userId, tvId);
	SHARED_REVALIDATE_PATHS.forEach(revalidateLocalized);
	return watched;
}

/**
 * Sets the watched state of a whole season (idempotent) and syncs the parent
 * TV show's watchlist status atomically.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @param totalEpisodes - Total number of episodes in the season.
 * @param watched - Target state to persist for every episode.
 * @returns The applied state, echoing `watched`.
 */
export async function setSeasonWatched(
	tvId: number,
	seasonNumber: number,
	totalEpisodes: number,
	watched: boolean
): Promise<boolean> {
	if (
		!Number.isInteger(totalEpisodes) ||
		totalEpisodes <= 0 ||
		totalEpisodes > MAX_SEASON_EPISODES
	) {
		throw new Error('Invalid episode count');
	}

	const { supabase, userId } = await getAuthenticatedUser();

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

	await syncTvShowWatchlistStatus(supabase, userId, tvId);
	SHARED_REVALIDATE_PATHS.forEach(revalidateLocalized);
	return watched;
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
