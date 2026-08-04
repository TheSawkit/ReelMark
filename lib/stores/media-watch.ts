'use client';

import { useSyncExternalStore } from 'react';
import { createKeyedStore } from '@/lib/stores/factory';
import type { MediaType, WatchStatus } from '@/types/tmdb';

export type MediaWatchStatus = WatchStatus | 'none';

interface MediaWatchState {
	status: MediaWatchStatus;
	dirty: boolean;
	baseStatus: MediaWatchStatus;
}

const {
	entries: media,
	notify,
	subscribe,
	version,
} = createKeyedStore<MediaWatchState>();

const mediaKey = (mediaType: MediaType, mediaId: number) =>
	`${mediaType}:${mediaId}`;

/**
 * Client-side source of truth for a media item's watchlist status, shared between the
 * detail page buttons and the community badge so mutations render instantly without
 * relying on a server re-render of the current page.
 */
export const mediaWatchStore = {
	seed(mediaType: MediaType, mediaId: number, status: MediaWatchStatus) {
		const key = mediaKey(mediaType, mediaId);
		const prev = media.get(key);
		if (prev?.dirty || prev?.status === status) return;
		media.set(key, { status, dirty: false, baseStatus: status });
		notify();
	},

	set(mediaType: MediaType, mediaId: number, status: MediaWatchStatus) {
		const key = mediaKey(mediaType, mediaId);
		const prev = media.get(key);
		media.set(key, {
			status,
			dirty: true,
			baseStatus: prev?.baseStatus ?? prev?.status ?? 'none',
		});
		notify();
	},

	applyRemote(
		mediaType: MediaType,
		mediaId: number,
		status: MediaWatchStatus
	) {
		const key = mediaKey(mediaType, mediaId);
		const prev = media.get(key);
		if (prev?.status === status) return;
		media.set(key, {
			status,
			dirty: true,
			baseStatus: prev?.baseStatus ?? prev?.status ?? 'none',
		});
		notify();
	},

	get(mediaType: MediaType, mediaId: number): MediaWatchState | undefined {
		return media.get(mediaKey(mediaType, mediaId));
	},

	restore(
		mediaType: MediaType,
		mediaId: number,
		state: MediaWatchState | undefined
	) {
		const key = mediaKey(mediaType, mediaId);
		if (state) media.set(key, state);
		else media.delete(key);
		notify();
	},
};

/**
 * Net change in how many entries hold `target` since the server rendered.
 *
 * @param target - Watchlist status being counted.
 * @param mediaType - Restricts the count to movies or shows; omit for both.
 */
export function watchStatusDelta(
	target: MediaWatchStatus,
	mediaType?: MediaType
): number {
	let delta = 0;
	for (const [key, state] of media) {
		if (mediaType && !key.startsWith(`${mediaType}:`)) continue;
		if (state.baseStatus === state.status) continue;
		if (state.status === target) delta += 1;
		else if (state.baseStatus === target) delta -= 1;
	}
	return delta;
}

/** Reactive `watchStatusDelta`, so counters stay accurate after a mutation without re-fetching. */
export function useWatchStatusDelta(
	status: MediaWatchStatus,
	mediaType?: MediaType
): number {
	return useSyncExternalStore(
		subscribe,
		() => watchStatusDelta(status, mediaType),
		() => 0
	);
}

/** Bumps on every store change; lets list views re-derive buckets from mutated statuses. */
export function useMediaWatchVersion(): number {
	return useSyncExternalStore(subscribe, version, () => 0);
}

/** Reactive watchlist status for a media item; undefined until seeded or mutated. */
export function useMediaWatch(
	mediaType: MediaType,
	mediaId: number
): MediaWatchStatus | undefined {
	return useSyncExternalStore(
		subscribe,
		() => media.get(mediaKey(mediaType, mediaId))?.status,
		() => undefined
	);
}
