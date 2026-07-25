'use server';

import { getOptionalUser } from '@/lib/supabase/auth-helpers';
import { getWatchlistWithProgress } from '@/lib/data/watchlist';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { getSeasonDetails } from '@/lib/tmdb';
import { getCachedTvShowDetails } from '@/lib/tmdb/cached';
import { findNextEpisode, type SeasonEpisodeCount } from '@/lib/next-episode';
import type { WatchlistEntry } from '@/types/tmdb';

export interface ContinueWatchingEpisode {
	seasonNumber: number;
	episodeNumber: number;
	name: string;
	stillPath: string | null;
}

export interface ContinueWatchingItem {
	tvId: number;
	title: string;
	posterPath: string | null;
	totalEpisodes: number;
	seasonNumber: number;
	seasonWatchedEpisodes: number[];
	seasonWatched: { seasonNumber: number; watched: number }[];
	queue: ContinueWatchingEpisode[];
}

const SHOW_LIMIT = 10;
const QUEUE_LIMIT = 10;
const RECENT_WATCHES_LIMIT = 300;

type WatchedBySeason = Map<number, Set<number>>;

const hasAired = (airDate: string | null) =>
	!airDate || Date.parse(airDate) <= Date.now();

async function buildItem(
	entry: WatchlistEntry,
	watchedBySeason: WatchedBySeason
): Promise<ContinueWatchingItem | null> {
	const details = await getCachedTvShowDetails(entry.media_id).catch(
		() => null
	);
	if (!details) return null;

	const seasons: SeasonEpisodeCount[] = (details.seasons ?? [])
		.filter((season) => season.season_number > 0)
		.map((season) => ({
			seasonNumber: season.season_number,
			episodeCount: season.episode_count,
		}));

	const next = findNextEpisode(seasons, watchedBySeason);
	if (!next) return null;

	const season = await getSeasonDetails(
		entry.media_id,
		next.seasonNumber
	).catch(() => null);
	if (!season) return null;

	const watchedEpisodes = watchedBySeason.get(next.seasonNumber) ?? new Set();
	const queue = season.episodes
		.filter(
			(episode) =>
				episode.episode_number >= next.episodeNumber &&
				!watchedEpisodes.has(episode.episode_number) &&
				hasAired(episode.air_date)
		)
		.slice(0, QUEUE_LIMIT)
		.map((episode) => ({
			seasonNumber: next.seasonNumber,
			episodeNumber: episode.episode_number,
			name: episode.name,
			stillPath: episode.still_path,
		}));
	if (queue.length === 0) return null;

	return {
		tvId: entry.media_id,
		title: entry.media_title,
		posterPath: entry.poster_path,
		totalEpisodes: seasons.reduce(
			(sum, season) => sum + season.episodeCount,
			0
		),
		seasonNumber: next.seasonNumber,
		seasonWatchedEpisodes: [...watchedEpisodes],
		seasonWatched: seasons.map((season) => ({
			seasonNumber: season.seasonNumber,
			watched: watchedBySeason.get(season.seasonNumber)?.size ?? 0,
		})),
		queue,
	};
}

/**
 * TV shows the user can pick up right now, each resolved to its next unwatched episode
 * plus the aired episodes that follow it, so the dashboard card can advance without a refetch.
 *
 * @returns At most 10 shows, most recently watched first; empty when unauthenticated.
 */
export async function getContinueWatching(): Promise<ContinueWatchingItem[]> {
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return [];

	const { watchlist, tvProgress } = await getWatchlistWithProgress();
	const candidates = watchlist.filter(
		(entry) => entry.media_type === 'tv' && entry.status === 'to_watch'
	);
	if (candidates.length === 0) return [];

	const candidateIds = candidates.map((entry) => entry.media_id);
	const { data: recentWatches } = await supabase
		.from('episode_watches')
		.select('tv_id, watched_at')
		.eq('user_id', userId)
		.in('tv_id', candidateIds)
		.order('watched_at', { ascending: false, nullsFirst: false })
		.limit(RECENT_WATCHES_LIMIT);

	const recencyRank = new Map<number, number>();
	for (const [index, watch] of (recentWatches ?? []).entries()) {
		if (!recencyRank.has(watch.tv_id)) recencyRank.set(watch.tv_id, index);
	}

	const rankOf = (entry: WatchlistEntry) =>
		recencyRank.get(entry.media_id) ?? Number.MAX_SAFE_INTEGER;

	const selected = [...candidates]
		.sort((a, b) => {
			const byRecency = rankOf(a) - rankOf(b);
			if (byRecency !== 0) return byRecency;
			const byProgress =
				(tvProgress[b.media_id] ?? 0) - (tvProgress[a.media_id] ?? 0);
			if (byProgress !== 0) return byProgress;
			return b.created_at.localeCompare(a.created_at);
		})
		.slice(0, SHOW_LIMIT);

	const watches = await fetchAllRows((from, to) =>
		supabase
			.from('episode_watches')
			.select('tv_id, season_number, episode_number')
			.eq('user_id', userId)
			.in(
				'tv_id',
				selected.map((entry) => entry.media_id)
			)
			.order('tv_id')
			.order('season_number')
			.order('episode_number')
			.range(from, to)
	);

	const watchedByShow = new Map<number, WatchedBySeason>();
	for (const watch of watches) {
		const show = watchedByShow.get(watch.tv_id) ?? new Map();
		const episodes = show.get(watch.season_number) ?? new Set<number>();
		episodes.add(watch.episode_number);
		show.set(watch.season_number, episodes);
		watchedByShow.set(watch.tv_id, show);
	}

	const items = await Promise.all(
		selected.map((entry) =>
			buildItem(entry, watchedByShow.get(entry.media_id) ?? new Map())
		)
	);

	return items.filter((item) => item !== null);
}
