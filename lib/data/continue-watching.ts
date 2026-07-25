import { cache } from 'react';
import { getOptionalUser } from '@/lib/supabase/auth-helpers';
import { getWatchlistWithProgress } from '@/lib/data/watchlist';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { getSeasonDetails } from '@/lib/tmdb';
import { getCachedTvShowDetails } from '@/lib/tmdb/cached';
import { findNextEpisode, type SeasonEpisodeCount } from '@/lib/next-episode';
import { orderByWatchRecency } from '@/lib/continue-watching';
import type { WatchlistEntry } from '@/types/tmdb';

type SupabaseServerClient = Awaited<
	ReturnType<typeof getOptionalUser>
>['supabase'];

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
const WAVE_SIZE = 10;
const SCAN_LIMIT = 40;

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

async function buildWave(
	supabase: SupabaseServerClient,
	userId: string,
	entries: WatchlistEntry[]
): Promise<ContinueWatchingItem[]> {
	const watches = await fetchAllRows((from, to) =>
		supabase
			.from('episode_watches')
			.select('tv_id, season_number, episode_number')
			.eq('user_id', userId)
			.in(
				'tv_id',
				entries.map((entry) => entry.media_id)
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
		entries.map((entry) =>
			buildItem(entry, watchedByShow.get(entry.media_id) ?? new Map())
		)
	);

	return items.filter((item) => item !== null);
}

/**
 * TV shows the user can pick up right now, each resolved to its next unwatched episode
 * plus the aired episodes that follow it, so the dashboard card can advance without a refetch.
 *
 * Shows are ranked by the timestamp of their last watched episode; those with nothing left to
 * watch (finished, or next episode unaired) drop out and the next-most-recent show takes the
 * slot, which is why candidates are resolved in waves instead of being truncated upfront.
 *
 * Request-cached: the dashboard hero and the row below it share one resolution.
 *
 * @returns At most 10 shows, most recently watched first; empty when unauthenticated.
 */
export const getContinueWatching = cache(
	async (): Promise<ContinueWatchingItem[]> => {
		const { supabase, userId } = await getOptionalUser();
		if (!userId) return [];

		const { watchlist, tvProgress } = await getWatchlistWithProgress();
		const candidates = watchlist.filter(
			(entry) => entry.media_type === 'tv' && entry.status === 'to_watch'
		);
		if (candidates.length === 0) return [];

		const { data: lastWatches } = await supabase.rpc(
			'episode_last_watches'
		);
		const lastWatchedAt = new Map<number, string>();
		for (const row of lastWatches ?? []) {
			if (row.last_watched_at)
				lastWatchedAt.set(row.tv_id, row.last_watched_at);
		}

		const ordered = orderByWatchRecency(
			candidates,
			lastWatchedAt,
			tvProgress
		);
		const scannable = Math.min(ordered.length, SCAN_LIMIT);
		const items: ContinueWatchingItem[] = [];

		for (
			let start = 0;
			start < scannable && items.length < SHOW_LIMIT;
			start += WAVE_SIZE
		) {
			const wave = ordered.slice(start, start + WAVE_SIZE);
			items.push(...(await buildWave(supabase, userId, wave)));
		}

		return items.slice(0, SHOW_LIMIT);
	}
);
