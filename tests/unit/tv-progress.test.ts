import { describe, it, expect } from 'vitest';
import { buildTvProgressMap, missingTotalEpisodes } from '@/lib/tv-progress';

const entry = (media_id: number, total_episodes?: number | null) => ({
	media_id,
	total_episodes,
});

describe('missingTotalEpisodes', () => {
	it('keeps only the shows whose total is not stored on the row', () => {
		expect(
			missingTotalEpisodes([entry(1, 24), entry(2, null), entry(3)])
		).toEqual([2, 3]);
	});

	it('treats a stored zero as known', () => {
		expect(missingTotalEpisodes([entry(1, 0)])).toEqual([]);
	});
});

describe('buildTvProgressMap', () => {
	it('pairs each show with its watched count and stored total', () => {
		expect(
			buildTvProgressMap([entry(1, 24), entry(2, 10)], { 1: 7 }, {})
		).toEqual({
			1: { watched: 7, total: 24 },
			2: { watched: 0, total: 10 },
		});
	});

	it('falls back to the fetched total when the row has none', () => {
		expect(
			buildTvProgressMap([entry(5, null)], { 5: 3 }, { 5: 62 })
		).toEqual({ 5: { watched: 3, total: 62 } });
	});

	it('prefers the stored total over the fetched one', () => {
		expect(buildTvProgressMap([entry(5, 62)], {}, { 5: 999 })).toEqual({
			5: { watched: 0, total: 62 },
		});
	});

	it('yields a zero total when neither source knows the show', () => {
		expect(buildTvProgressMap([entry(9)], {}, {})).toEqual({
			9: { watched: 0, total: 0 },
		});
	});
});
