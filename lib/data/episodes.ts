import 'server-only';

import { getOptionalUser } from '@/lib/supabase/auth-helpers';
import { fetchAllRows } from '@/lib/supabase/pagination';

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

/** Total watched episode count per show, for the requested TMDB show IDs. */
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
