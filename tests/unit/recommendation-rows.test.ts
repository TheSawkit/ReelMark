import { describe, it, expect } from 'vitest';
import { pickPersonSeeds, filterFreshItems } from '@/lib/recommendations';
import { knownTvProgress } from '@/lib/tv-progress';
import type { MediaItem, WatchlistEntry, WatchStatus } from '@/types/tmdb';

function entry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
	const id = overrides.media_id ?? 1;
	return {
		id: `row-${id}`,
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
		poster_path: '/poster.jpg',
		backdrop_path: null,
		release_date: '2026-01-01',
		vote_average: 7,
		vote_count: 100,
		popularity: 10,
		...overrides,
	};
}

const affinity = (favorites: number[]) => ({
	favorites: new Set(favorites),
	disliked: new Set<number>(),
});

describe('pickPersonSeeds', () => {
	it('keeps only titles rated at or above the person threshold', () => {
		const seeds = pickPersonSeeds(
			[
				entry({ media_id: 1 }),
				entry({ media_id: 2 }),
				entry({ media_id: 3 }),
			],
			{ 'movie-1': 9, 'movie-2': 7, 'movie-3': 8 }
		);
		expect(seeds.map((s) => s.media_id)).toEqual([1, 3]);
	});

	it('ignores unrated titles', () => {
		expect(pickPersonSeeds([entry({ media_id: 1 })], {})).toEqual([]);
	});

	it('caps the seed list at four titles', () => {
		const entries = [1, 2, 3, 4, 5, 6].map((id) => entry({ media_id: id }));
		const ratings = Object.fromEntries(
			entries.map((e) => [`movie-${e.media_id}`, 10])
		);
		expect(pickPersonSeeds(entries, ratings)).toHaveLength(4);
	});
});

describe('filterFreshItems', () => {
	it('keeps a title whose genre matches a favourite', () => {
		const kept = filterFreshItems(
			[item(1, { genre_ids: [28, 12] })],
			new Set(),
			affinity([12])
		);
		expect(kept.map((i) => i.id)).toEqual([1]);
	});

	it('drops titles with no matching genre, no poster, or already consumed', () => {
		const kept = filterFreshItems(
			[
				item(1, { genre_ids: [99] }),
				item(2, { genre_ids: [12], poster_path: null }),
				item(3, { genre_ids: [12] }),
			],
			new Set(['movie-3']),
			affinity([12])
		);
		expect(kept).toEqual([]);
	});

	it('drops a title carrying no genre at all', () => {
		expect(filterFreshItems([item(1)], new Set(), affinity([12]))).toEqual(
			[]
		);
	});

	it('caps the row at twenty titles', () => {
		const items = Array.from({ length: 30 }, (_, i) =>
			item(i + 1, { genre_ids: [12] })
		);
		expect(filterFreshItems(items, new Set(), affinity([12]))).toHaveLength(
			20
		);
	});
});

describe('knownTvProgress', () => {
	it('maps watched counts against the stored episode total', () => {
		expect(
			knownTvProgress([{ media_id: 7, total_episodes: 24 }], { 7: 10 })
		).toEqual({ 7: { watched: 10, total: 24 } });
	});

	it('defaults an unwatched show to zero', () => {
		expect(
			knownTvProgress([{ media_id: 7, total_episodes: 24 }], {})
		).toEqual({ 7: { watched: 0, total: 24 } });
	});

	it('leaves out shows whose total is unknown, so their card renders no bar', () => {
		expect(
			knownTvProgress(
				[
					{ media_id: 1, total_episodes: null },
					{ media_id: 2 },
					{ media_id: 3, total_episodes: 0 },
				],
				{ 1: 5, 2: 5, 3: 5 }
			)
		).toEqual({});
	});
});
