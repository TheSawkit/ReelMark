'use client';

import { useSyncExternalStore } from 'react';
import { createKeyedStore } from '@/lib/keyed-store';

export interface SeasonWatchState {
	count: number;
	episodes: ReadonlySet<number> | null;
	dirty: boolean;
}

const {
	entries: seasons,
	notify,
	subscribe,
} = createKeyedStore<SeasonWatchState>();

const seasonKey = (tvId: number, seasonNumber: number) =>
	`${tvId}:${seasonNumber}`;

/**
 * Client-side source of truth for per-season watch progress, shared between
 * episode buttons, season buttons and progress bars so mutations render
 * instantly without a server round-trip re-render.
 */
export const episodeWatchStore = {
	seed(
		tvId: number,
		seasonNumber: number,
		count: number,
		episodeNumbers?: number[]
	) {
		const key = seasonKey(tvId, seasonNumber);
		const prev = seasons.get(key);
		if (prev?.dirty) return;
		const episodes = episodeNumbers
			? new Set(episodeNumbers)
			: (prev?.episodes ?? null);
		if (prev && prev.count === count && prev.episodes === episodes) return;
		seasons.set(key, { count, episodes, dirty: false });
		notify();
	},

	setEpisode(
		tvId: number,
		seasonNumber: number,
		episodeNumber: number,
		watched: boolean
	) {
		const key = seasonKey(tvId, seasonNumber);
		const prev = seasons.get(key);
		if (prev?.episodes) {
			const episodes = new Set(prev.episodes);
			if (watched) episodes.add(episodeNumber);
			else episodes.delete(episodeNumber);
			seasons.set(key, { count: episodes.size, episodes, dirty: true });
		} else {
			const base = prev?.count ?? (watched ? 0 : 1);
			seasons.set(key, {
				count: Math.max(0, base + (watched ? 1 : -1)),
				episodes: null,
				dirty: true,
			});
		}
		notify();
	},

	setSeasonEpisodes(
		tvId: number,
		seasonNumber: number,
		episodeNumbers: number[]
	) {
		const episodes = new Set(episodeNumbers);
		seasons.set(seasonKey(tvId, seasonNumber), {
			count: episodes.size,
			episodes,
			dirty: true,
		});
		notify();
	},

	setWatchedUpTo(tvId: number, seasonNumber: number, upToEpisode: number) {
		const key = seasonKey(tvId, seasonNumber);
		const prev = seasons.get(key);
		const episodes = new Set(prev?.episodes ?? []);
		for (let i = 1; i <= upToEpisode; i++) episodes.add(i);
		seasons.set(key, { count: episodes.size, episodes, dirty: true });
		notify();
	},

	setSeason(
		tvId: number,
		seasonNumber: number,
		watched: boolean,
		totalEpisodes: number
	) {
		const key = seasonKey(tvId, seasonNumber);
		const episodes = watched
			? new Set(Array.from({ length: totalEpisodes }, (_, i) => i + 1))
			: new Set<number>();
		seasons.set(key, {
			count: watched ? totalEpisodes : 0,
			episodes,
			dirty: true,
		});
		notify();
	},

	/**
	 * Applies an episode change made on another device. Ignored when the season's episode
	 * set is not loaded: without it the update can only bump a counter, which would
	 * double-count the echo of this device's own write.
	 */
	applyRemoteEpisode(
		tvId: number,
		seasonNumber: number,
		episodeNumber: number,
		watched: boolean
	) {
		const key = seasonKey(tvId, seasonNumber);
		const prev = seasons.get(key);
		if (!prev?.episodes) return;
		if (prev.episodes.has(episodeNumber) === watched) return;

		const episodes = new Set(prev.episodes);
		if (watched) episodes.add(episodeNumber);
		else episodes.delete(episodeNumber);
		seasons.set(key, { count: episodes.size, episodes, dirty: true });
		notify();
	},

	get(tvId: number, seasonNumber: number): SeasonWatchState | undefined {
		return seasons.get(seasonKey(tvId, seasonNumber));
	},

	clearShow(tvId: number) {
		const prefix = `${tvId}:`;
		let changed = false;
		for (const key of seasons.keys()) {
			if (!key.startsWith(prefix)) continue;
			seasons.set(key, {
				count: 0,
				episodes: new Set(),
				dirty: true,
			});
			changed = true;
		}
		if (changed) notify();
	},

	restore(
		tvId: number,
		seasonNumber: number,
		state: SeasonWatchState | undefined
	) {
		const key = seasonKey(tvId, seasonNumber);
		if (state) seasons.set(key, state);
		else seasons.delete(key);
		notify();
	},
};

/** Reactive per-season watch state; undefined until seeded or mutated. */
export function useSeasonWatch(
	tvId: number,
	seasonNumber: number
): SeasonWatchState | undefined {
	return useSyncExternalStore(
		subscribe,
		() => seasons.get(seasonKey(tvId, seasonNumber)),
		() => undefined
	);
}

/** Reactive watched state of a single episode, falling back to the server value until the season is seeded. */
export function useEpisodeWatched(
	tvId: number,
	seasonNumber: number,
	episodeNumber: number,
	initialWatched: boolean
): boolean {
	const season = useSeasonWatch(tvId, seasonNumber);
	return season?.episodes
		? season.episodes.has(episodeNumber)
		: initialWatched;
}

/** Show-level watched total, mixing store counts with server fallbacks per season. */
export function useTvWatchTotal(
	tvId: number,
	fallbacks: { seasonNumber: number; watched: number }[]
): number {
	return useSyncExternalStore(
		subscribe,
		() =>
			fallbacks.reduce(
				(sum, s) =>
					sum +
					(seasons.get(seasonKey(tvId, s.seasonNumber))?.count ??
						s.watched),
				0
			),
		() => fallbacks.reduce((sum, s) => sum + s.watched, 0)
	);
}
