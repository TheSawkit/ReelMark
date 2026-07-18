import { describe, it, expect } from 'vitest';
import {
	pickSeeds,
	favoriteGenres,
	rankRecommendations,
} from '@/lib/recommendations';
import type { MediaItem, WatchlistEntry, WatchStatus } from '@/types/tmdb';

let nextId = 1;

function entry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
	const id = overrides.media_id ?? nextId++;
	return {
		id: `row-${id}`,
		user_id: 'user',
		media_id: id,
		media_title: `Title ${id}`,
		media_type: 'movie',
		poster_path: null,
		status: 'watched' as WatchStatus,
		created_at: '2026-01-01T00:00:00Z',
		total_episodes: null,
		release_date: null,
		genre_ids: null,
		...overrides,
	};
}

function item(id: number, overrides: Partial<MediaItem> = {}): MediaItem {
	return {
		id,
		media_type: 'movie',
		title: `Movie ${id}`,
		original_title: `Movie ${id}`,
		overview: '',
		poster_path: null,
		backdrop_path: null,
		release_date: '2024-01-01',
		vote_average: 7,
		vote_count: 100,
		popularity: 10,
		...overrides,
	};
}

describe('pickSeeds', () => {
	it('puts the best-rated watched titles first', () => {
		const entries = [
			entry({ media_id: 1 }),
			entry({ media_id: 2 }),
			entry({ media_id: 3 }),
		];
		const seeds = pickSeeds(entries, { 'movie-2': 9, 'movie-3': 7 });

		expect(seeds.map((s) => s.entry.media_id)).toEqual([2, 3, 1]);
		expect(seeds[0].weight).toBeGreaterThan(seeds[1].weight);
		expect(seeds[1].weight).toBeGreaterThan(seeds[2].weight);
	});

	it('never seeds from abandoned or low-rated titles', () => {
		const entries = [
			entry({ media_id: 1, status: 'abandoned' }),
			entry({ media_id: 2 }),
			entry({ media_id: 3 }),
		];
		const seeds = pickSeeds(entries, { 'movie-3': 3 });

		expect(seeds.map((s) => s.entry.media_id)).toEqual([2]);
	});

	it('falls back to the to-watch list and caps the seed count', () => {
		const entries = [
			...Array.from({ length: 4 }, (_, i) =>
				entry({ media_id: i + 1, status: 'to_watch' })
			),
			...Array.from({ length: 4 }, (_, i) => entry({ media_id: i + 10 })),
		];
		const seeds = pickSeeds(entries, {});

		expect(seeds).toHaveLength(6);
		expect(seeds.slice(0, 4).every((s) => s.entry.media_id >= 10)).toBe(
			true
		);
	});
});

describe('favoriteGenres', () => {
	it('returns the most frequent genres, ignoring abandoned entries', () => {
		const entries = [
			entry({ media_id: 1, genre_ids: [18, 80] }),
			entry({ media_id: 2, genre_ids: [18, 35] }),
			entry({ media_id: 3, genre_ids: [18, 80, 99] }),
			entry({ media_id: 4, status: 'abandoned', genre_ids: [27, 27] }),
		];

		const favorites = favoriteGenres(entries);
		expect(favorites.has(18)).toBe(true);
		expect(favorites.has(80)).toBe(true);
		expect(favorites.has(27)).toBe(false);
		expect(favorites.size).toBe(3);
	});
});

describe('rankRecommendations', () => {
	it('ranks candidates seen across several seeds above single-seed ones', () => {
		const ranked = rankRecommendations(
			[
				{ weight: 1, items: [item(1), item(2)] },
				{ weight: 1, items: [item(2), item(3)] },
			],
			new Set(),
			new Set()
		);

		expect(ranked[0].id).toBe(2);
	});

	it('excludes titles already in the library', () => {
		const ranked = rankRecommendations(
			[{ weight: 1, items: [item(1), item(2)] }],
			new Set(['movie-1']),
			new Set()
		);

		expect(ranked.map((r) => r.id)).toEqual([2]);
	});

	it('boosts favourite-genre matches over identical candidates', () => {
		const ranked = rankRecommendations(
			[
				{
					weight: 1,
					items: [
						item(1, { genre_ids: [10] }),
						item(2, { genre_ids: [18, 80] }),
					],
				},
			],
			new Set(),
			new Set([18, 80])
		);

		expect(ranked[0].id).toBe(2);
	});

	it('weights seeds by the user rating behind them', () => {
		const ranked = rankRecommendations(
			[
				{ weight: 1.6, items: [item(1)] },
				{ weight: 1, items: [item(2)] },
			],
			new Set(),
			new Set()
		);

		expect(ranked[0].id).toBe(1);
	});

	it('caps the result size at 20', () => {
		const many = Array.from({ length: 30 }, (_, i) => item(i + 1));
		const ranked = rankRecommendations(
			[{ weight: 1, items: many }],
			new Set(),
			new Set()
		);

		expect(ranked).toHaveLength(20);
	});
});
