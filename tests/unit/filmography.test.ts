import { describe, it, expect } from 'vitest';
import {
	buildFilmographyDepartments,
	type CrewCreditItem,
} from '@/lib/filmography';
import type { MediaItem } from '@/types/tmdb';

function item(
	partial: Partial<MediaItem> & { id: number; media_type: 'movie' | 'tv' }
): MediaItem {
	return {
		title: `Title ${partial.id}`,
		original_title: `Title ${partial.id}`,
		overview: '',
		poster_path: '/poster.jpg',
		backdrop_path: null,
		release_date: '',
		vote_average: 0,
		vote_count: 0,
		popularity: 1,
		...partial,
	};
}

function crew(department: string, media: MediaItem): CrewCreditItem {
	return { department, item: media };
}

describe('buildFilmographyDepartments', () => {
	it('returns an acting tab plus one tab per mapped crew department', () => {
		const result = buildFilmographyDepartments(
			[item({ id: 1, media_type: 'movie' })],
			[
				crew('Directing', item({ id: 2, media_type: 'movie' })),
				crew('Sound', item({ id: 3, media_type: 'movie' })),
			],
			'Acting'
		);
		expect(result.map((d) => d.key)).toEqual([
			'acting',
			'directing',
			'sound',
		]);
	});

	it('surfaces the known-for department first', () => {
		const result = buildFilmographyDepartments(
			[item({ id: 1, media_type: 'movie' })],
			[crew('Directing', item({ id: 2, media_type: 'movie' }))],
			'Directing'
		);
		expect(result[0].key).toBe('directing');
		expect(result[1].key).toBe('acting');
	});

	it('drops unmapped departments like Art and Visual Effects', () => {
		const result = buildFilmographyDepartments(
			[],
			[
				crew('Art', item({ id: 2, media_type: 'movie' })),
				crew('Visual Effects', item({ id: 3, media_type: 'movie' })),
			],
			'Art'
		);
		expect(result).toHaveLength(0);
	});

	it('deduplicates a title within a department and drops posterless items', () => {
		const result = buildFilmographyDepartments(
			[],
			[
				crew('Directing', item({ id: 5, media_type: 'movie' })),
				crew('Directing', item({ id: 5, media_type: 'movie' })),
				crew(
					'Directing',
					item({ id: 6, media_type: 'movie', poster_path: null })
				),
			],
			'Directing'
		);
		expect(result).toHaveLength(1);
		expect(result[0].items.map((i) => i.id)).toEqual([5]);
	});

	it('sorts each department by popularity descending', () => {
		const result = buildFilmographyDepartments(
			[
				item({ id: 1, media_type: 'movie', popularity: 5 }),
				item({ id: 2, media_type: 'tv', popularity: 50 }),
			],
			[],
			'Acting'
		);
		expect(result[0].items.map((i) => i.id)).toEqual([2, 1]);
	});

	it('returns an empty list when the person has no usable credits', () => {
		expect(buildFilmographyDepartments([], [], 'Acting')).toEqual([]);
	});
});
