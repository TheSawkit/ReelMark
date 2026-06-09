import { describe, it, expect } from 'vitest';
import {
	applyListControls,
	availableGenres,
	DEFAULT_LIST_CONTROLS,
	type ListControlsState,
} from '@/lib/media-list/controls';
import type { MediaItem } from '@/types/tmdb';

function makeItem(overrides: Partial<MediaItem>): MediaItem {
	return {
		id: 1,
		media_type: 'movie',
		title: 'Untitled',
		original_title: 'Untitled',
		overview: '',
		poster_path: null,
		backdrop_path: null,
		release_date: '',
		vote_average: 0,
		vote_count: 0,
		popularity: 0,
		...overrides,
	};
}

const matrix = makeItem({
	id: 1,
	title: 'The Matrix',
	release_date: '1999-03-31',
	genre_ids: [28, 878],
	addedAt: '2024-01-01T00:00:00Z',
	userRating: 9,
});
const dune = makeItem({
	id: 2,
	title: 'Dune',
	release_date: '2021-09-15',
	genre_ids: [12, 878],
	addedAt: '2024-03-01T00:00:00Z',
	userRating: 7,
});
const amelie = makeItem({
	id: 3,
	title: 'Amélie',
	release_date: '2001-04-25',
	genre_ids: [35, 18],
	addedAt: '2024-02-01T00:00:00Z',
	userRating: null,
});

const items = [matrix, dune, amelie];

function state(overrides: Partial<ListControlsState>): ListControlsState {
	return { ...DEFAULT_LIST_CONTROLS, ...overrides };
}

describe('applyListControls — sorting', () => {
	it('sorts by date added descending by default', () => {
		const result = applyListControls(items, DEFAULT_LIST_CONTROLS);
		expect(result.map((i) => i.id)).toEqual([2, 3, 1]);
	});

	it('sorts by date added ascending', () => {
		const result = applyListControls(items, state({ sortDir: 'asc' }));
		expect(result.map((i) => i.id)).toEqual([1, 3, 2]);
	});

	it('sorts by release year ascending', () => {
		const result = applyListControls(
			items,
			state({ sortKey: 'year', sortDir: 'asc' })
		);
		expect(result.map((i) => i.id)).toEqual([1, 3, 2]);
	});

	it('sorts by title alphabetically ascending', () => {
		const result = applyListControls(
			items,
			state({ sortKey: 'title', sortDir: 'asc' })
		);
		expect(result.map((i) => i.title)).toEqual([
			'Amélie',
			'Dune',
			'The Matrix',
		]);
	});

	it('sorts by rating descending and places null ratings last', () => {
		const result = applyListControls(
			items,
			state({ sortKey: 'rating', sortDir: 'desc' })
		);
		expect(result.map((i) => i.id)).toEqual([1, 2, 3]);
	});

	it('keeps items without the sort value last regardless of direction', () => {
		const result = applyListControls(
			items,
			state({ sortKey: 'rating', sortDir: 'asc' })
		);
		expect(result[result.length - 1].id).toBe(3);
	});
});

describe('applyListControls — genre filter', () => {
	it('keeps items matching any selected genre', () => {
		const result = applyListControls(items, state({ genreIds: [878] }));
		expect(result.map((i) => i.id).sort()).toEqual([1, 2]);
	});

	it('combines genre filter with sorting', () => {
		const result = applyListControls(
			items,
			state({ genreIds: [878], sortKey: 'year', sortDir: 'asc' })
		);
		expect(result.map((i) => i.id)).toEqual([1, 2]);
	});

	it('returns empty when no item matches the selected genre', () => {
		const result = applyListControls(items, state({ genreIds: [99999] }));
		expect(result).toEqual([]);
	});
});

describe('applyListControls — actor match set', () => {
	it('restricts the list to provided actor match keys', () => {
		const result = applyListControls(
			items,
			DEFAULT_LIST_CONTROLS,
			new Set(['movie-2'])
		);
		expect(result.map((i) => i.id)).toEqual([2]);
	});

	it('does not filter by actor when match set is null', () => {
		const result = applyListControls(items, DEFAULT_LIST_CONTROLS, null);
		expect(result).toHaveLength(3);
	});
});

describe('availableGenres', () => {
	it('returns distinct named genres present in the list, sorted by name', () => {
		const names: Record<number, string> = {
			28: 'Action',
			878: 'Science-Fiction',
			12: 'Aventure',
			35: 'Comédie',
			18: 'Drame',
		};
		const genres = availableGenres(items, names);
		expect(genres.map((g) => g.name)).toEqual([
			'Action',
			'Aventure',
			'Comédie',
			'Drame',
			'Science-Fiction',
		]);
	});

	it('omits genre ids without a known name', () => {
		const genres = availableGenres(items, { 28: 'Action' });
		expect(genres).toEqual([{ id: 28, name: 'Action' }]);
	});
});
