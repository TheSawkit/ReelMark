import { describe, it, expect } from 'vitest';
import {
	pickSeeds,
	genreAffinity,
	rankRecommendations,
	applyDismissals,
	pickFavoritePerson,
	isPersonSeedRating,
	pickSuggestion,
	pickSimilarSeeds,
	type TasteProfile,
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

function taste(overrides: Partial<TasteProfile> = {}): TasteProfile {
	return { ratings: {}, ratedAt: {}, episodesWatched: {}, ...overrides };
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
		const seeds = pickSeeds(
			entries,
			taste({ ratings: { 'movie-2': 9, 'movie-3': 7 } })
		);

		expect(seeds.map((s) => s.entry.media_id)).toEqual([2, 3, 1]);
		expect(seeds[0].weight).toBeGreaterThan(seeds[1].weight);
		expect(seeds[1].weight).toBeGreaterThan(seeds[2].weight);
	});

	it('treats an unrated watched title as liked', () => {
		const seeds = pickSeeds([entry({ media_id: 1 })], taste());

		expect(seeds).toHaveLength(1);
		expect(seeds[0].weight).toBeGreaterThan(1);
	});

	it('still seeds a 2-star title (4/10) but with reduced weight', () => {
		const seeds = pickSeeds(
			[entry({ media_id: 1 })],
			taste({ ratings: { 'movie-1': 4 } })
		);

		expect(seeds).toHaveLength(1);
		expect(seeds[0].weight).toBeLessThan(1);
	});

	it('never seeds from abandoned or sub-2-star titles', () => {
		const entries = [
			entry({ media_id: 1, status: 'abandoned' }),
			entry({ media_id: 2 }),
			entry({ media_id: 3 }),
		];
		const seeds = pickSeeds(entries, taste({ ratings: { 'movie-3': 3 } }));

		expect(seeds.map((s) => s.entry.media_id)).toEqual([2]);
	});

	it('falls back to the to-watch list and caps the seed count', () => {
		const entries = [
			...Array.from({ length: 4 }, (_, i) =>
				entry({ media_id: i + 1, status: 'to_watch' })
			),
			...Array.from({ length: 4 }, (_, i) => entry({ media_id: i + 10 })),
		];
		const seeds = pickSeeds(entries, taste());

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

		const seeds = pickSeeds([...favourites, recent], taste({ ratings }));
		expect(seeds.map((s) => s.entry.media_id)).toContain(100);
		expect(seeds).toHaveLength(6);
	});

	it('treats a title rated recently as recent, even if added long ago', () => {
		const favourites = [1, 2, 3].map((id) =>
			entry({ media_id: id, created_at: '2019-01-01T00:00:00Z' })
		);
		const newlyAdded = [4, 5, 6].map((id) =>
			entry({ media_id: id, created_at: '2026-08-01T00:00:00Z' })
		);
		const rewatched = entry({
			media_id: 7,
			created_at: '2020-01-01T00:00:00Z',
		});
		const ratings = {
			'movie-1': 10,
			'movie-2': 10,
			'movie-3': 10,
			'movie-7': 8,
		};

		const seeds = pickSeeds(
			[...favourites, ...newlyAdded, rewatched],
			taste({ ratings, ratedAt: { 'movie-7': '2026-09-20T00:00:00Z' } })
		);
		expect(seeds.map((s) => s.entry.media_id)).toContain(7);
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

		const seeds = pickSeeds(
			[...done, binge],
			taste({ episodesWatched: { 77: 5 } })
		);
		expect(seeds[0].entry.media_id).toBe(77);
		expect(seeds[0].weight).toBeGreaterThan(seeds[1].weight);
	});
});

describe('pickSeeds reasons', () => {
	it('tells why each seed was picked', () => {
		const seeds = pickSeeds(
			[
				entry({
					media_id: 1,
					media_type: 'tv',
					status: 'to_watch',
					total_episodes: 10,
				}),
				entry({ media_id: 2, media_type: 'tv' }),
				entry({ media_id: 3, media_type: 'tv', status: 'to_watch' }),
			],
			taste({ episodesWatched: { 1: 2 } })
		);

		expect(seeds.map((s) => [s.entry.media_id, s.reason])).toEqual([
			[1, 'watching'],
			[2, 'liked'],
			[3, 'listed'],
		]);
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

		const { favorites } = genreAffinity(
			entries,
			taste({ ratings: { 'movie-4': 5 } })
		);
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

		const { disliked } = genreAffinity(
			entries,
			taste({ ratings: { 'movie-2': 2 } })
		);
		expect(disliked.has(27)).toBe(true);
		expect(disliked.has(10770)).toBe(true);
	});

	it('never marks a genre disliked when the user loves it elsewhere', () => {
		const entries = [
			entry({ media_id: 1, genre_ids: [18] }),
			entry({ media_id: 2, genre_ids: [18] }),
			entry({ media_id: 3, status: 'abandoned', genre_ids: [18, 27] }),
		];

		const { disliked } = genreAffinity(entries, taste());
		expect(disliked.has(18)).toBe(false);
		expect(disliked.has(27)).toBe(true);
	});

	it('ignores the unwatched backlog when deriving favourites', () => {
		const loved = [1, 2, 3, 4].map((id) =>
			entry({ media_id: id, genre_ids: [878] })
		);
		const backlog = Array.from({ length: 10 }, (_, i) =>
			entry({ media_id: 50 + i, status: 'to_watch', genre_ids: [18, 35] })
		);
		const ratings = Object.fromEntries(
			loved.map((l) => [`movie-${l.media_id}`, 10])
		);

		const { favorites } = genreAffinity(
			[...loved, ...backlog],
			taste({ ratings })
		);
		expect(favorites.has(878)).toBe(true);
		expect(favorites.has(18)).toBe(false);
	});

	it('marks a genre disliked when most of its signals are negative', () => {
		const entries = [
			...[1, 2, 3, 4, 5].map((id) =>
				entry({ media_id: id, status: 'abandoned', genre_ids: [27] })
			),
			entry({ media_id: 6, genre_ids: [27] }),
			entry({ media_id: 7, status: 'to_watch', genre_ids: [27] }),
		];

		const { disliked } = genreAffinity(entries, taste());
		expect(disliked.has(27)).toBe(true);
	});

	it('ranks genres by how much more than usual the user liked them', () => {
		const entries = [
			...[1, 2].map((id) => entry({ media_id: id, genre_ids: [18] })),
			...[3, 4].map((id) => entry({ media_id: id, genre_ids: [35] })),
			...[5, 6].map((id) => entry({ media_id: id, genre_ids: [99] })),
			...[7, 8].map((id) => entry({ media_id: id, genre_ids: [878] })),
		];
		const ratings = {
			'movie-1': 7,
			'movie-2': 7,
			'movie-3': 7,
			'movie-4': 7,
			'movie-5': 7,
			'movie-6': 7,
			'movie-7': 10,
			'movie-8': 10,
		};

		const { favorites } = genreAffinity(entries, taste({ ratings }));
		expect(favorites.has(878)).toBe(true);
	});

	it('counts a show in progress as a liked signal', () => {
		const entries = [
			entry({
				media_id: 1,
				media_type: 'tv',
				status: 'to_watch',
				genre_ids: [10765],
				total_episodes: 10,
			}),
		];

		expect(
			genreAffinity(
				entries,
				taste({ episodesWatched: { 1: 3 } })
			).favorites.has(10765)
		).toBe(true);
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

	it('credits each title to the seed that contributed most', () => {
		const ranked = rankRecommendations(
			[
				{
					weight: 1.1,
					because: { title: 'Dune', reason: 'liked' },
					items: [item(1), item(2)],
				},
				{
					weight: 1.6,
					because: { title: 'Arrival', reason: 'liked' },
					items: [item(2)],
				},
			],
			new Set(),
			noAffinity
		);

		const byId = Object.fromEntries(ranked.map((r) => [r.id, r.becauseOf]));
		expect(byId[1]).toEqual({ title: 'Dune', reason: 'liked' });
		expect(byId[2]).toEqual({ title: 'Arrival', reason: 'liked' });
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
	it('excludes dismissed titles and marks a genre disliked after repeated dismissals', () => {
		const excluded = new Set<string>();
		const affinity = {
			favorites: new Set([18]),
			disliked: new Set<number>(),
		};

		applyDismissals(excluded, affinity, [
			{ media_id: 42, media_type: 'movie', genre_ids: [27, 18] },
			{ media_id: 43, media_type: 'movie', genre_ids: [27, 18] },
		]);

		expect(excluded.has('movie-42')).toBe(true);
		expect(excluded.has('movie-43')).toBe(true);
		expect(affinity.disliked.has(27)).toBe(true);
		expect(affinity.disliked.has(18)).toBe(false);
	});

	it('only hides the title after a single dismissal', () => {
		const excluded = new Set<string>();
		const affinity = {
			favorites: new Set<number>(),
			disliked: new Set<number>(),
		};

		applyDismissals(excluded, affinity, [
			{ media_id: 42, media_type: 'movie', genre_ids: [80] },
		]);

		expect(excluded.has('movie-42')).toBe(true);
		expect(affinity.disliked.has(80)).toBe(false);
	});
});

describe('pickSimilarSeeds', () => {
	it('opens rows only from the latest watched titles the user liked', () => {
		const entries = [
			entry({ media_id: 1, created_at: '2026-09-05T00:00:00Z' }),
			entry({ media_id: 2, created_at: '2026-09-04T00:00:00Z' }),
			entry({ media_id: 3, created_at: '2026-09-03T00:00:00Z' }),
			entry({ media_id: 4, created_at: '2026-09-02T00:00:00Z' }),
			entry({ media_id: 5, created_at: '2026-09-01T00:00:00Z' }),
			entry({ media_id: 6, status: 'to_watch' }),
		];

		const seeds = pickSimilarSeeds(
			entries,
			taste({ ratings: { 'movie-1': 1, 'movie-3': 5 } })
		);
		expect(seeds.map((s) => s.media_id)).toEqual([2, 4, 5]);
	});

	it('opens a row for the title rated most recently first', () => {
		const entries = [
			entry({ media_id: 1, created_at: '2026-09-05T00:00:00Z' }),
			entry({ media_id: 2, created_at: '2020-01-01T00:00:00Z' }),
		];

		const seeds = pickSimilarSeeds(
			entries,
			taste({
				ratings: { 'movie-2': 9 },
				ratedAt: { 'movie-2': '2026-09-20T00:00:00Z' },
			})
		);
		expect(seeds.map((s) => s.media_id)).toEqual([2, 1]);
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
		expect(pickSuggestion(entries, taste(), [], seeds, new Set())?.id).toBe(
			102
		);
	});

	it('never repeats a past suggestion nor a dismissed title', () => {
		const dismissed = [
			{ media_id: 102, media_type: 'movie' as const, genre_ids: [] },
		];
		expect(
			pickSuggestion(
				[],
				taste(),
				dismissed,
				seeds,
				new Set(['movie-101'])
			)?.id
		).toBe(103);
	});

	it('favours the genres of a show the user is watching right now', () => {
		const binge = entry({
			media_id: 7,
			media_type: 'tv',
			status: 'to_watch',
			genre_ids: [10765],
			total_episodes: 10,
		});
		const candidates = [
			{
				weight: 1,
				items: [
					item(201, { media_type: 'tv', genre_ids: [18] }),
					item(202, { media_type: 'tv', genre_ids: [10765] }),
				],
			},
		];

		const pick = pickSuggestion(
			[binge],
			taste({ episodesWatched: { 7: 4 } }),
			[],
			candidates,
			new Set()
		);
		expect(pick?.id).toBe(202);
	});

	it('returns null when every candidate is excluded', () => {
		const entries = [101, 102, 103, 104].map((id) =>
			entry({ media_id: id })
		);
		expect(
			pickSuggestion(entries, taste(), [], seeds, new Set())
		).toBeNull();
	});
});
