import 'server-only';

import {
	getAuthenticatedUser,
	getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { validateUUID } from '@/lib/validators';
import { reportSwallowed } from '@/lib/report';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

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

	const { data: watches, error: watchesError } = await supabase
		.from('episode_watches')
		.select('episode_number')
		.eq('user_id', userId)
		.eq('tv_id', tvId)
		.eq('season_number', seasonNumber);
	if (watchesError) reportSwallowed('episodes:season', watchesError);

	return new Set((watches ?? []).map((w) => w.episode_number));
}

/** Watched episode count per season for one show, keyed by season number. */
export async function getTvShowWatchProgress(
	tvId: number
): Promise<Map<number, number>> {
	const { supabase, userId } = await getOptionalUser();

	if (!userId) return new Map();

	const watches = await fetchAllRows((from, to) =>
		supabase
			.from('episode_watches')
			.select('season_number, episode_number')
			.eq('user_id', userId)
			.eq('tv_id', tvId)
			.order('season_number')
			.order('episode_number')
			.range(from, to)
	);

	const progress = new Map<number, number>();
	for (const w of watches) {
		progress.set(w.season_number, (progress.get(w.season_number) ?? 0) + 1);
	}
	return progress;
}

const TV_IDS_PER_CALL = 1000;

export interface MyTvProgress {
	/** Watched episode count keyed by TMDB show id (specials included, as before). */
	watched: Record<number, number>;
	/** ISO timestamp of the latest watched episode, keyed by TMDB show id. */
	lastWatchedAt: Map<number, string>;
}

/**
 * The signed-in user's progress on the requested shows, counted in SQL (`my_tv_progress`): one
 * row per requested show, where `episode_watch_counts` + `episode_last_watches` sent every show
 * of the account in two round-trips for JS to filter. Ids go in batches so PostgREST's
 * 1000-row cap can never truncate the answer.
 *
 * A failed batch is reported and left out, like the unchecked RPC it replaces: progress then
 * reads as zero instead of taking the section down.
 *
 * @param tvIds - TMDB show IDs to read.
 * @returns Counts and last watch dates; empty when signed out.
 */
export async function getMyTvProgress(tvIds: number[]): Promise<MyTvProgress> {
	const progress: MyTvProgress = { watched: {}, lastWatchedAt: new Map() };
	if (tvIds.length === 0) return progress;

	const { supabase, userId } = await getOptionalUser();
	if (!userId) return progress;

	const ids = [...new Set(tvIds)];
	const batches: number[][] = [];
	for (let start = 0; start < ids.length; start += TV_IDS_PER_CALL)
		batches.push(ids.slice(start, start + TV_IDS_PER_CALL));

	const results = await Promise.all(
		batches.map((batch) =>
			supabase.rpc('my_tv_progress', { p_tv_ids: batch })
		)
	);
	for (const { data, error } of results) {
		if (error) reportSwallowed('episodes:tv-progress', error);
		for (const row of data ?? []) {
			progress.watched[row.tv_id] = Number(row.watched_count);
			if (row.last_watched_at)
				progress.lastWatchedAt.set(row.tv_id, row.last_watched_at);
		}
	}
	return progress;
}

/** Total watched episode count per show, for the requested TMDB show IDs. */
export async function getAllTvShowsWatchProgress(
	tvIds: number[]
): Promise<Record<number, number>> {
	return (await getMyTvProgress(tvIds)).watched;
}

/**
 * Watched episode count per show for a profile being visited, so its cards can show progress.
 *
 * Visibility lives in `episode_watch_counts_for`, which returns nothing unless the viewer may see
 * the owner's watchlist or watched section — `episode_watches` itself is owner-only under RLS.
 *
 * @param profileUserId - Supabase user ID of the profile owner.
 * @param tvIds - TMDB show IDs already filtered to what the viewer may see.
 * @returns Watched episode count keyed by TMDB show ID; empty when not allowed.
 */
export async function getProfileTvWatchProgress(
	profileUserId: string,
	tvIds: number[]
): Promise<Record<number, number>> {
	if (tvIds.length === 0) return {};
	if (validateUUID(profileUserId) === null)
		throw new Error('Invalid user ID');

	const { supabase } = await getAuthenticatedUser();
	const { data: counts, error: countsError } = await supabase.rpc(
		'episode_watch_counts_for',
		{
			p_user_id: profileUserId,
		}
	);
	if (countsError) reportSwallowed('episodes:profile-progress', countsError);

	const wanted = new Set(tvIds);
	const totals: Record<number, number> = {};
	for (const row of counts ?? []) {
		if (wanted.has(row.tv_id)) totals[row.tv_id] = row.watched_count;
	}
	return totals;
}

/**
 * Watched episode count per show for any user, through a privileged client — the weekly
 * suggestion job runs without a session, so `episode_watch_counts` (bound to auth.uid()) is empty.
 * Counted in SQL (`user_episode_watch_counts`, service role only): one row per show crosses the
 * network instead of one per episode. Ids go in batches so the 1000-row response cap can never truncate.
 *
 * @param client - Service-role Supabase client.
 * @param userId - Supabase user ID whose progress is read.
 * @param tvIds - TMDB show IDs to count.
 * @returns Watched episode count keyed by TMDB show ID.
 * @throws Error when the count query fails.
 */
export async function getUserTvWatchCounts(
	client: SupabaseClient<Database>,
	userId: string,
	tvIds: number[]
): Promise<Record<number, number>> {
	const counts: Record<number, number> = {};
	for (let start = 0; start < tvIds.length; start += TV_IDS_PER_CALL) {
		const { data, error } = await client.rpc('user_episode_watch_counts', {
			p_user_id: userId,
			p_tv_ids: tvIds.slice(start, start + TV_IDS_PER_CALL),
		});
		if (error) throw new Error(error.message);
		for (const { tv_id, watched_count } of data)
			counts[tv_id] = watched_count;
	}
	return counts;
}
