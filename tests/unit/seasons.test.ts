import { describe, expect, it } from 'vitest';
import { buildSeasonOptions, nextSeasonOption } from '@/lib/seasons';
import type { Season } from '@/types/tmdb';

const season = (season_number: number, episode_count = 10): Season => ({
	id: season_number,
	name: season_number === 0 ? 'Specials' : `Season ${season_number}`,
	overview: '',
	poster_path: null,
	season_number,
	episode_count,
	air_date: null,
});

describe('buildSeasonOptions', () => {
	it('lists numbered seasons in order and specials last', () => {
		const options = buildSeasonOptions(
			[season(0), season(2), season(1)],
			new Map()
		);
		expect(options.map((o) => o.seasonNumber)).toEqual([1, 2, 0]);
	});

	it('drops announced seasons without episodes', () => {
		const options = buildSeasonOptions(
			[season(1), season(2, 0)],
			new Map()
		);
		expect(options.map((o) => o.seasonNumber)).toEqual([1]);
	});

	it('carries the viewer progress per season', () => {
		const options = buildSeasonOptions([season(1)], new Map([[1, 4]]));
		expect(options[0].watched).toBe(4);
	});
});

describe('nextSeasonOption', () => {
	const options = buildSeasonOptions(
		[season(0), season(1), season(2)],
		new Map()
	);

	it('returns the following numbered season', () => {
		expect(nextSeasonOption(options, 1)?.seasonNumber).toBe(2);
	});

	it('returns null after the last season, never the specials', () => {
		expect(nextSeasonOption(options, 2)).toBeNull();
	});

	it('returns null from the specials', () => {
		expect(nextSeasonOption(options, 0)).toBeNull();
	});
});
