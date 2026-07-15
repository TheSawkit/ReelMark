import { describe, it, expect, beforeEach } from 'vitest';
import { episodeWatchStore } from '@/lib/episode-watch-store';

const TV_ID = 1399;
const SEASON = 1;

const watchedNumbers = () => [
	...(episodeWatchStore.get(TV_ID, SEASON)?.episodes ?? []),
];

describe('episodeWatchStore.setWatchedUpTo', () => {
	beforeEach(() => {
		episodeWatchStore.restore(TV_ID, SEASON, undefined);
	});

	it('fills every gap below the target episode without dropping later ones', () => {
		episodeWatchStore.seed(TV_ID, SEASON, 3, [1, 3, 9]);

		episodeWatchStore.setWatchedUpTo(TV_ID, SEASON, 5);

		expect(watchedNumbers().sort((a, b) => a - b)).toEqual([
			1, 2, 3, 4, 5, 9,
		]);
		expect(episodeWatchStore.get(TV_ID, SEASON)?.count).toBe(6);
		expect(episodeWatchStore.get(TV_ID, SEASON)?.dirty).toBe(true);
	});
});

describe('episodeWatchStore.setSeasonEpisodes', () => {
	beforeEach(() => {
		episodeWatchStore.restore(TV_ID, SEASON, undefined);
	});

	it('replaces the season with exactly the given episodes', () => {
		episodeWatchStore.seed(TV_ID, SEASON, 10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

		episodeWatchStore.setSeasonEpisodes(TV_ID, SEASON, [2, 4]);

		expect(watchedNumbers().sort((a, b) => a - b)).toEqual([2, 4]);
		expect(episodeWatchStore.get(TV_ID, SEASON)?.count).toBe(2);
	});

	it('restores a partial state after a mark-all, which is what undo relies on', () => {
		episodeWatchStore.seed(TV_ID, SEASON, 3, [1, 2, 3]);
		const previous = watchedNumbers();

		episodeWatchStore.setSeason(TV_ID, SEASON, true, 10);
		expect(episodeWatchStore.get(TV_ID, SEASON)?.count).toBe(10);

		episodeWatchStore.setSeasonEpisodes(TV_ID, SEASON, previous);

		expect(watchedNumbers().sort((a, b) => a - b)).toEqual([1, 2, 3]);
	});

	it('empties the season when given no episodes', () => {
		episodeWatchStore.seed(TV_ID, SEASON, 2, [4, 8]);

		episodeWatchStore.setSeasonEpisodes(TV_ID, SEASON, []);

		expect(watchedNumbers()).toEqual([]);
		expect(episodeWatchStore.get(TV_ID, SEASON)?.count).toBe(0);
	});
});
