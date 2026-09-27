import { describe, it, expect } from 'vitest';
import {
	pickSeeds,
	genreAffinity,
	rankRecommendations,
	applyDismissals,
	pickFavoritePerson,
	isPersonSeedRating,
	pickSuggestion,
} from '@/lib/recommendations';
import type { MediaItem, WatchlistEntry, WatchStatus } from '@/types/tmdb';

let nextId = 1;

function entry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
	const id = overrides.media_id ?? nextId++;
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
		poster_path: null,
		backdrop_path: null,
		release_date: '2024-01-01',
		vote_average: 7,
		vote_count: 100,
		popularity: 10,
		...overrides,
	};
}

const noAffinity = {
	favorites: new Set<number>(),
	disliked: new Set<number>(),
};

describe('pickSeeds', () => {
	it('puts the best-rated watched titles first, unrated watched after', () => {
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

	it('treats an unrated watched title as liked', () => {
		const seeds = pickSeeds([entry({ media_id: 1 })], {});

		expect(seeds).toHaveLength(1);
		expect(seeds[0].weight).toBeGreaterThan(1);
	});

	it('still seeds a 2-star title (4/10) but with reduced weight', () => {
		const seeds = pickSeeds([entry({ media_id: 1 })], { 'movie-1': 4 });

		expect(seeds).toHaveLength(1);
		expect(seeds[0].weight).toBeLessThan(1);
	});

	it('never seeds from abandoned or sub-2-star titles', () => {
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

	it('keeps room for a recently watched title behind all-time favourites', () => {
		const favourites = [1, 2, 3, 4, 5, 6].map((id) =>
			entry({ media_id: id, created_at: '2020-01-01T00:00:00Z' })
		);
		const recent = entry({
			media_id: 100,
			created_at: '2026-09-01T00:00:00Z',
		});
		const ratings = Object.fromEntries([
			['movie-100', 9],
			...favourites.map((f) => [`movie-${f.media_id}`, 10]),
		]);

		const seeds = pickSeeds([...favourites, recent], ratings);
		expect(seeds.map((s) => s.entry.media_id)).toContain(100);
		expect(seeds).toHaveLength(6);
	});

	it('seeds first from a show the user is watching right now', () => {
		const done = [1, 2, 3, 4, 5, 6].map((id) =>
			entry({ media_id: id, media_type: 'tv' })
		);
		const binge = entry({
			media_id: 77,
			media_type: 'tv',
			status: 'to_watch',
			total_episodes: 20,
		});

		const seeds = pickSeeds([...done, binge], {}, { 77: 5 });
		expect(seeds[0].entry.media_id).toBe(77);
		expect(seeds[0].weight).toBeGreaterThan(seeds[1].weight);
	});
});

describe('genreAffinity', () => {
	it('builds favourites from liked titles only', () => {
		const entries = [
			entry({ media_id: 1, genre_ids: [18, 80] }),
			entry({ media_id: 2, genre_ids: [18, 35] }),
			entry({ media_id: 3, genre_ids: [18, 80, 99] }),
			entry({ media_id: 4, genre_ids: [10749] }),
		];

		const { favorites } = genreAffinity(entries, { 'movie-4': 5 });
		expect(favorites.has(18)).toBe(true);
		expect(favorites.has(80)).toBe(true);
		expect(favorites.has(10749)).toBe(false);
		expect(favorites.size).toBe(3);
	});

	it('marks genres of abandoned and badly rated titles as disliked', () => {
		const entries = [
			entry({ media_id: 1, status: 'abandoned', genre_ids: [27] }),
			entry({ media_id: 2, genre_ids: [10770] }),
		];

		const { disliked } = genreAffinity(entries, { 'movie-2': 2 });
		expect(disliked.has(27)).toBe(true);
		expect(disliked.has(10770)).toBe(true);
	});

	it('never marks a genre disliked when the user loves it elsewhere', () => {
		const entries = [
			entry({ media_id: 1, genre_ids: [18] }),
			entry({ media_id: 2, genre_ids: [18] }),
			entry({ media_id: 3, status: 'abandoned', genre_ids: [18, 27] }),
		];

		const { disliked } = genreAffinity(entries, {});
		expect(disliked.has(18)).toBe(false);
		expect(disliked.has(27)).toBe(true);
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
			noAffinity
		);

		expect(ranked[0].id).toBe(2);
	});

	it('excludes titles already in the library', () => {
		const ranked = rankRecommendations(
			[{ weight: 1, items: [item(1), item(2)] }],
			new Set(['movie-1']),
			noAffinity
		);

		expect(ranked.map((r) => r.id)).toEqual([2]);
	});

	it('boosts favourite-genre matches and penalises disliked ones', () => {
		const ranked = rankRecommendations(
			[
				{
					weight: 1,
					items: [
						item(1, { genre_ids: [27] }),
						item(2, { genre_ids: [10] }),
						item(3, { genre_ids: [18, 80] }),
					],
				},
			],
			new Set(),
			{ favorites: new Set([18, 80]), disliked: new Set([27]) }
		);

		expect(ranked[0].id).toBe(3);
		expect(ranked[ranked.length - 1].id).toBe(1);
	});

	it('weights seeds by the user rating behind them', () => {
		const ranked = rankRecommendations(
			[
				{ weight: 1.6, items: [item(1)] },
				{ weight: 1, items: [item(2)] },
			],
			new Set(),
			noAffinity
		);

		expect(ranked[0].id).toBe(1);
	});

	it('caps the result size at 20', () => {
		const many = Array.from({ length: 30 }, (_, i) => item(i + 1));
		const ranked = rankRecommendations(
			[{ weight: 1, items: many }],
			new Set(),
			noAffinity
		);

		expect(ranked).toHaveLength(20);
	});

	it('caps a single genre at 6 in the top 20 when alternatives exist', () => {
		const drama = Array.from({ length: 15 }, (_, i) =>
			item(i + 1, { genre_ids: [18], vote_average: 9 })
		);
		const comedy = Array.from({ length: 10 }, (_, i) =>
			item(i + 100, { genre_ids: [35], vote_average: 5 })
		);
		const ranked = rankRecommendations(
			[{ weight: 1, items: [...drama, ...comedy] }],
			new Set(),
			noAffinity
		);

		const headDramaCount = ranked
			.slice(0, 12)
			.filter((r) => (r.genre_ids ?? []).includes(18)).length;
		expect(headDramaCount).toBe(6);
		expect(ranked.some((r) => (r.genre_ids ?? []).includes(35))).toBe(true);
		expect(ranked).toHaveLength(20);
	});
});

describe('applyDismissals', () => {
	it('excludes dismissed titles and marks their genres disliked', () => {
		const excluded = new Set<string>();
		const affinity = {
			favorites: new Set([18]),
			disliked: new Set<number>(),
		};

		applyDismissals(excluded, affinity, [
			{ media_id: 42, media_type: 'movie', genre_ids: [27, 18] },
		]);

		expect(excluded.has('movie-42')).toBe(true);
		expect(affinity.disliked.has(27)).toBe(true);
		expect(affinity.disliked.has(18)).toBe(false);
	});
});

describe('pickFavoritePerson', () => {
	const nolan = { id: 1, name: 'Christopher Nolan' };
	const bale = { id: 2, name: 'Christian Bale' };

	it('prefers a recurring director over a one-off actor', () => {
		const person = pickFavoritePerson([
			{ directors: [nolan], cast: [bale] },
			{ directors: [nolan], cast: [] },
		]);

		expect(person?.id).toBe(1);
	});

	it('returns null when nobody recurs enough', () => {
		const person = pickFavoritePerson([
			{ directors: [], cast: [bale] },
			{ directors: [], cast: [{ id: 3, name: 'Someone Else' }] },
		]);

		expect(person).toBeNull();
	});

	it('picks a lead actor present across several titles', () => {
		const person = pickFavoritePerson([
			{ directors: [], cast: [bale] },
			{ directors: [], cast: [bale] },
			{ directors: [], cast: [bale] },
		]);

		expect(person?.id).toBe(2);
	});

	it('tags a person picked for their directing as a director', () => {
		const person = pickFavoritePerson([
			{ directors: [nolan], cast: [] },
			{ directors: [nolan], cast: [] },
		]);

		expect(person?.role).toBe('director');
	});

	it('tags a person picked for their acting as an actor', () => {
		const person = pickFavoritePerson([
			{ directors: [], cast: [bale] },
			{ directors: [], cast: [bale] },
			{ directors: [], cast: [bale] },
		]);

		expect(person?.role).toBe('actor');
	});
});

describe('isPersonSeedRating', () => {
	it('requires a rating of at least 8', () => {
		expect(isPersonSeedRating(8)).toBe(true);
		expect(isPersonSeedRating(10)).toBe(true);
		expect(isPersonSeedRating(7)).toBe(false);
		expect(isPersonSeedRating(undefined)).toBe(false);
	});
});

describe('pickSuggestion', () => {
	const seeds = [
		{ weight: 1, items: [item(101), item(102), item(103), item(104)] },
	];

	it('returns the best-ranked title the user does not have yet', () => {
		const entries = [entry({ media_id: 101, status: 'to_watch' })];
		expect(pickSuggestion(entries, {}, [], seeds, new Set())?.id).toBe(102);
	});

	it('never repeats a past suggestion nor a dismissed title', () => {
		const dismissed = [
			{ media_id: 102, media_type: 'movie' as const, genre_ids: [] },
		];
		expect(
			pickSuggestion([], {}, dismissed, seeds, new Set(['movie-101']))?.id
		).toBe(103);
	});

	it('returns null when every candidate is excluded', () => {
		const entries = [101, 102, 103, 104].map((id) =>
			entry({ media_id: id })
		);
		expect(pickSuggestion(entries, {}, [], seeds, new Set())).toBeNull();
	});
});
