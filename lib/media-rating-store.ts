'use client';

import { useSyncExternalStore } from 'react';
import type { Review, ReviewMediaType } from '@/types/profile';

export interface CommunityRating {
	avg: number;
	count: number;
}

const ratings = new Map<string, CommunityRating | null>();
const myReviews = new Map<string, Review | null>();
const listeners = new Set<() => void>();

const ratingKey = (mediaType: ReviewMediaType, mediaId: number) =>
	`${mediaType}:${mediaId}`;

function notify() {
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/**
 * Recomputes a community average after one user swaps their rating.
 * Ratings are a plain arithmetic mean, so the new value is exact without refetching.
 *
 * @param current - Current average and count, or null when nobody rated yet.
 * @param previousRating - The user's previous rating, null if they had none.
 * @param nextRating - The user's new rating, null when they removed it.
 */
export function nextCommunityRating(
	current: CommunityRating | null,
	previousRating: number | null,
	nextRating: number | null
): CommunityRating | null {
	let count = current?.count ?? 0;
	let sum = (current?.avg ?? 0) * count;

	if (previousRating !== null) {
		sum -= previousRating;
		count -= 1;
	}
	if (nextRating !== null) {
		sum += nextRating;
		count += 1;
	}

	if (count <= 0) return null;
	return { avg: Math.max(0, sum) / count, count };
}

/** Client-side community rating and own review, kept in sync across the detail banner badge and the rating section. */
export const mediaRatingStore = {
	applyUserRating(
		mediaType: ReviewMediaType,
		mediaId: number,
		current: CommunityRating | null,
		previousRating: number | null,
		nextRating: number | null
	) {
		ratings.set(
			ratingKey(mediaType, mediaId),
			nextCommunityRating(current, previousRating, nextRating)
		);
		notify();
	},

	setMyReview(
		mediaType: ReviewMediaType,
		mediaId: number,
		review: Review | null
	) {
		myReviews.set(ratingKey(mediaType, mediaId), review);
		notify();
	},

	/** Drops the local average so the next server render wins — use when the new average can't be derived locally. */
	invalidateRating(mediaType: ReviewMediaType, mediaId: number) {
		ratings.delete(ratingKey(mediaType, mediaId));
		notify();
	},
};

/** Reactive community rating; falls back to the server value until the store is written. */
export function useMediaRating(
	mediaType: ReviewMediaType,
	mediaId: number,
	fallback: CommunityRating | null
): CommunityRating | null {
	const key = ratingKey(mediaType, mediaId);
	return useSyncExternalStore(
		subscribe,
		() => (ratings.has(key) ? (ratings.get(key) ?? null) : fallback),
		() => fallback
	);
}

/** Reactive own review for a media item; falls back to the server value until the store is written. */
export function useMyReview(
	mediaType: ReviewMediaType,
	mediaId: number,
	fallback: Review | null
): Review | null {
	const key = ratingKey(mediaType, mediaId);
	return useSyncExternalStore(
		subscribe,
		() => (myReviews.has(key) ? (myReviews.get(key) ?? null) : fallback),
		() => fallback
	);
}
