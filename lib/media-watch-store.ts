'use client';

import { useSyncExternalStore } from 'react';
import { createKeyedStore } from '@/lib/keyed-store';
import type { MediaType, WatchStatus } from '@/types/tmdb';

export type MediaWatchStatus = WatchStatus | 'none';

interface MediaWatchState {
	status: MediaWatchStatus;
	dirty: boolean;
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
		media.set(key, { status, dirty: false });
		notify();
	},

	set(mediaType: MediaType, mediaId: number, status: MediaWatchStatus) {
		media.set(mediaKey(mediaType, mediaId), { status, dirty: true });
		notify();
	},

	applyRemote(mediaType: MediaType, mediaId: number, status: MediaWatchStatus) {
		const key = mediaKey(mediaType, mediaId);
		if (media.get(key)?.status === status) return;
		media.set(key, { status, dirty: true });
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
