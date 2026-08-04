'use client';

import { useSyncExternalStore } from 'react';
import { createKeyedStore } from '@/lib/stores/factory';

export interface SeasonWatchState {
	count: number;
	episodes: ReadonlySet<number> | null;
	dirty: boolean;
	baseCount: number;
}

const {
	entries: seasons,
	notify,
	subscribe,
	version,
} = createKeyedStore<SeasonWatchState>();

const seasonKey = (tvId: number, seasonNumber: number) =>
	`${tvId}:${seasonNumber}`;

type SeasonWrite = Omit<SeasonWatchState, 'baseCount'>;

const touchOrder = new Map<number, number>();
let touchCounter = 0;

/**
 * Keeps the server-rendered count alive across mutations so views can derive a session delta,
 * and records which show was touched last so the dashboard hero can follow the user.
 */
function write(key: string, next: SeasonWrite, countBefore: number) {
	const prev = seasons.get(key);
	seasons.set(key, { ...next, baseCount: prev?.baseCount ?? countBefore });
	touchOrder.set(Number(key.split(':')[0]), ++touchCounter);
}

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
		seasons.set(key, { count, episodes, dirty: false, baseCount: count });
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
			write(
				key,
				{ count: episodes.size, episodes, dirty: true },
				prev.count
			);
		} else {
			const base = prev?.count ?? (watched ? 0 : 1);
			write(
				key,
				{
					count: Math.max(0, base + (watched ? 1 : -1)),
					episodes: null,
					dirty: true,
				},
				base
			);
		}
		notify();
	},

	setSeasonEpisodes(
		tvId: number,
		seasonNumber: number,
		episodeNumbers: number[]
	) {
		const key = seasonKey(tvId, seasonNumber);
		const episodes = new Set(episodeNumbers);
		write(
			key,
			{ count: episodes.size, episodes, dirty: true },
			seasons.get(key)?.count ?? episodes.size
		);
		notify();
	},

	setWatchedUpTo(tvId: number, seasonNumber: number, upToEpisode: number) {
		const key = seasonKey(tvId, seasonNumber);
		const prev = seasons.get(key);
		const episodes = new Set(prev?.episodes ?? []);
		for (let i = 1; i <= upToEpisode; i++) episodes.add(i);
		write(
			key,
			{ count: episodes.size, episodes, dirty: true },
			prev?.count ?? 0
		);
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
		write(
			key,
			{ count: watched ? totalEpisodes : 0, episodes, dirty: true },
			seasons.get(key)?.count ?? (watched ? 0 : totalEpisodes)
		);
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
		write(key, { count: episodes.size, episodes, dirty: true }, prev.count);
		notify();
	},

	get(tvId: number, seasonNumber: number): SeasonWatchState | undefined {
		return seasons.get(seasonKey(tvId, seasonNumber));
	},

	clearShow(tvId: number) {
		const prefix = `${tvId}:`;
		let changed = false;
		for (const [key, state] of seasons) {
			if (!key.startsWith(prefix)) continue;
			write(
				key,
				{ count: 0, episodes: new Set(), dirty: true },
				state.count
			);
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

/**
 * Episodes ticked (or unticked) in this session versus what the server rendered.
 *
 * @param tvId - Restricts the delta to one show; omit for the whole session.
 */
export function episodeWatchDelta(tvId?: number): number {
	const prefix = tvId === undefined ? undefined : `${tvId}:`;
	let delta = 0;
	for (const [key, state] of seasons) {
		if (prefix && !key.startsWith(prefix)) continue;
		delta += state.count - state.baseCount;
	}
	return delta;
}

/** Reactive `episodeWatchDelta`, so a server-rendered total stays accurate without re-fetching. */
export function useEpisodeWatchDelta(tvId?: number): number {
	return useSyncExternalStore(
		subscribe,
		() => episodeWatchDelta(tvId),
		() => 0
	);
}

/** Server-rendered watched count for a show, kept live from this session's episode changes. */
export function useShowWatchedTotal(tvId: number, serverTotal: number): number {
	return serverTotal + useEpisodeWatchDelta(tvId);
}

/** Same as `useShowWatchedTotal` without subscribing — for views comparing several shows in one pass. */
export function showWatchedTotal(tvId: number, serverTotal: number): number {
	return serverTotal + episodeWatchDelta(tvId);
}

/** Bumps on every episode change; lets a view re-derive totals for several shows at once. */
export function useEpisodeWatchVersion(): number {
	return useSyncExternalStore(subscribe, version, () => 0);
}

/**
 * Show whose episodes were ticked most recently in this session — the one the user is
 * actually watching right now, which outranks the order the server sent.
 */
export function lastTouchedShowId(): number | null {
	let latest: { tvId: number; order: number } | null = null;
	for (const [tvId, order] of touchOrder) {
		if (!latest || order > latest.order) latest = { tvId, order };
	}
	return latest?.tvId ?? null;
}

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
