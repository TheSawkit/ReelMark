import { describe, it, expect } from 'vitest';
import { findNextEpisode, type SeasonEpisodeCount } from '@/lib/next-episode';

const seasons: SeasonEpisodeCount[] = [
	{ seasonNumber: 0, episodeCount: 4 },
	{ seasonNumber: 1, episodeCount: 3 },
	{ seasonNumber: 2, episodeCount: 2 },
];

const watched = (entries: [number, number[]][]): Map<number, Set<number>> =>
	new Map(entries.map(([season, episodes]) => [season, new Set(episodes)]));

describe('findNextEpisode', () => {
	it('starts at the first episode of a show never watched', () => {
		expect(findNextEpisode(seasons, watched([]))).toEqual({
			seasonNumber: 1,
			episodeNumber: 1,
		});
	});

	it('returns the episode following the last watched one', () => {
		expect(findNextEpisode(seasons, watched([[1, [1, 2]]]))).toEqual({
			seasonNumber: 1,
			episodeNumber: 3,
		});
	});

	it('moves to the next season once the current one is finished', () => {
		expect(findNextEpisode(seasons, watched([[1, [1, 2, 3]]]))).toEqual({
			seasonNumber: 2,
			episodeNumber: 1,
		});
	});

	it('returns null when every regular episode is watched', () => {
		const fully = watched([
			[1, [1, 2, 3]],
			[2, [1, 2]],
		]);
		expect(findNextEpisode(seasons, fully)).toBeNull();
	});

	it('fills gaps left in the middle before moving forward', () => {
		const gapped = watched([
			[1, [1, 3]],
			[2, [1, 2]],
		]);
		expect(findNextEpisode(seasons, gapped)).toEqual({
			seasonNumber: 1,
			episodeNumber: 2,
		});
	});

	it('ignores specials, watched or not', () => {
		const withSpecials = watched([
			[0, [1]],
			[1, [1, 2, 3]],
			[2, [1, 2]],
		]);
		expect(findNextEpisode(seasons, withSpecials)).toBeNull();

		expect(
			findNextEpisode([{ seasonNumber: 0, episodeCount: 4 }], watched([]))
		).toBeNull();
	});

	it('walks seasons in order regardless of the input order', () => {
		const shuffled: SeasonEpisodeCount[] = [
			{ seasonNumber: 2, episodeCount: 2 },
			{ seasonNumber: 1, episodeCount: 3 },
		];
		expect(findNextEpisode(shuffled, watched([[2, [1, 2]]]))).toEqual({
			seasonNumber: 1,
			episodeNumber: 1,
		});
	});

	it('skips seasons announced with no episode yet', () => {
		const upcoming: SeasonEpisodeCount[] = [
			{ seasonNumber: 1, episodeCount: 2 },
			{ seasonNumber: 2, episodeCount: 0 },
		];
		expect(findNextEpisode(upcoming, watched([[1, [1, 2]]]))).toBeNull();
	});
});
