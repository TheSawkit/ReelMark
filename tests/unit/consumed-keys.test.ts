import { describe, it, expect } from 'vitest';
import { isConsumed, consumedKeys } from '@/lib/recommendations/engine';
import type { WatchlistEntry, WatchStatus, MediaType } from '@/types/tmdb';

const entry = (
	overrides: Partial<WatchlistEntry> & {
		media_id: number;
		media_type: MediaType;
		status: WatchStatus;
	}
): WatchlistEntry => ({
	id: `row-${overrides.media_id}`,
	user_id: 'user',
	media_title: 'Title',
	poster_path: null,
	created_at: '2026-01-01T00:00:00Z',
	total_episodes: null,
	release_date: null,
	genre_ids: null,
	...overrides,
});

const movie = (status: WatchStatus) =>
	entry({ media_id: 1, media_type: 'movie', status });

const show = (status: WatchStatus, total: number | null) =>
	entry({ media_id: 2, media_type: 'tv', status, total_episodes: total });

describe('isConsumed', () => {
	it('treats a watched movie as done', () => {
		expect(isConsumed(movie('watched'), {})).toBe(true);
	});

	it('keeps a planned movie suggestable', () => {
		expect(isConsumed(movie('to_watch'), {})).toBe(false);
	});

	it('treats a show marked watched as done, whatever the episode count', () => {
		expect(isConsumed(show('watched', 73), { 2: 9 })).toBe(true);
	});

	it('treats a show with every episode ticked as done', () => {
		expect(isConsumed(show('to_watch', 10), { 2: 10 })).toBe(true);
	});

	it('keeps a show in progress suggestable', () => {
		expect(isConsumed(show('to_watch', 73), { 2: 9 })).toBe(false);
	});

	it('keeps an abandoned show suggestable', () => {
		expect(isConsumed(show('abandoned', 73), { 2: 9 })).toBe(false);
	});

	it('treats an abandoned show that was fully watched as done', () => {
		expect(isConsumed(show('abandoned', 10), { 2: 10 })).toBe(true);
	});

	it('keeps a show suggestable when its episode count is unknown', () => {
		expect(isConsumed(show('to_watch', null), { 2: 40 })).toBe(false);
	});

	it('keeps a show with no episode watched suggestable', () => {
		expect(isConsumed(show('to_watch', 10), {})).toBe(false);
	});
});

describe('consumedKeys', () => {
	it('keys only the finished titles, by media type', () => {
		const keys = consumedKeys(
			[
				entry({ media_id: 10, media_type: 'movie', status: 'watched' }),
				entry({
					media_id: 11,
					media_type: 'movie',
					status: 'to_watch',
				}),
				entry({
					media_id: 12,
					media_type: 'tv',
					status: 'to_watch',
					total_episodes: 4,
				}),
				entry({
					media_id: 13,
					media_type: 'tv',
					status: 'to_watch',
					total_episodes: 4,
				}),
			],
			{ 12: 4, 13: 1 }
		);

		expect([...keys].sort()).toEqual(['movie-10', 'tv-12']);
	});

	it('is empty when nothing has been finished', () => {
		expect(
			consumedKeys([movie('to_watch'), show('abandoned', 10)], {}).size
		).toBe(0);
	});
});
