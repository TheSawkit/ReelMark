import { describe, it, expect, beforeEach } from 'vitest';
import {
	episodeWatchStore,
	episodeWatchDelta,
	showWatchedTotal,
} from '@/lib/episode-watch-store';
import { mediaWatchStore, watchStatusDelta } from '@/lib/media-watch-store';

const SHOW = 1399;
const OTHER_SHOW = 615;
const MOVIE = 550;

describe('episodeWatchDelta', () => {
	beforeEach(() => {
		for (const season of [1, 2]) {
			episodeWatchStore.restore(SHOW, season, undefined);
			episodeWatchStore.restore(OTHER_SHOW, season, undefined);
		}
	});

	it('is zero for a freshly seeded season', () => {
		episodeWatchStore.seed(SHOW, 1, 3, [1, 2, 3]);

		expect(episodeWatchDelta(SHOW)).toBe(0);
	});

	it('counts an episode ticked after the server render', () => {
		episodeWatchStore.seed(SHOW, 1, 3, [1, 2, 3]);

		episodeWatchStore.setEpisode(SHOW, 1, 4, true);

		expect(episodeWatchDelta(SHOW)).toBe(1);
		expect(showWatchedTotal(SHOW, 9)).toBe(10);
	});

	it('goes negative when an episode is unticked', () => {
		episodeWatchStore.seed(SHOW, 1, 3, [1, 2, 3]);

		episodeWatchStore.setEpisode(SHOW, 1, 3, false);

		expect(episodeWatchDelta(SHOW)).toBe(-1);
	});

	it('returns to zero once a mutation is rolled back', () => {
		episodeWatchStore.seed(SHOW, 1, 3, [1, 2, 3]);
		const previous = episodeWatchStore.get(SHOW, 1);

		episodeWatchStore.setEpisode(SHOW, 1, 4, true);
		episodeWatchStore.restore(SHOW, 1, previous);

		expect(episodeWatchDelta(SHOW)).toBe(0);
	});

	it('sums seasons of the same show and ignores the others', () => {
		episodeWatchStore.seed(SHOW, 1, 2, [1, 2]);
		episodeWatchStore.seed(SHOW, 2, 0, []);
		episodeWatchStore.seed(OTHER_SHOW, 1, 5, [1, 2, 3, 4, 5]);

		episodeWatchStore.setEpisode(SHOW, 1, 3, true);
		episodeWatchStore.setEpisode(SHOW, 2, 1, true);
		episodeWatchStore.setEpisode(OTHER_SHOW, 1, 6, true);

		expect(episodeWatchDelta(SHOW)).toBe(2);
		expect(episodeWatchDelta(OTHER_SHOW)).toBe(1);
		expect(episodeWatchDelta()).toBe(3);
	});

	it('counts a whole season marked at once', () => {
		episodeWatchStore.seed(SHOW, 2, 0, []);

		episodeWatchStore.setSeason(SHOW, 2, true, 10);

		expect(episodeWatchDelta(SHOW)).toBe(10);
	});

	it('drops the show back to its baseline when the show is cleared', () => {
		episodeWatchStore.seed(SHOW, 1, 4, [1, 2, 3, 4]);

		episodeWatchStore.clearShow(SHOW);

		expect(episodeWatchDelta(SHOW)).toBe(-4);
	});
});

describe('watchStatusDelta', () => {
	beforeEach(() => {
		mediaWatchStore.restore('movie', MOVIE, undefined);
		mediaWatchStore.restore('tv', SHOW, undefined);
	});

	it('is zero for a seeded entry', () => {
		mediaWatchStore.seed('movie', MOVIE, 'to_watch');

		expect(watchStatusDelta('to_watch')).toBe(0);
	});

	it('counts an entry entering the watchlist', () => {
		mediaWatchStore.seed('movie', MOVIE, 'none');

		mediaWatchStore.set('movie', MOVIE, 'to_watch');

		expect(watchStatusDelta('to_watch')).toBe(1);
	});

	it('counts an entry leaving a status', () => {
		mediaWatchStore.seed('movie', MOVIE, 'to_watch');

		mediaWatchStore.set('movie', MOVIE, 'watched');

		expect(watchStatusDelta('to_watch')).toBe(-1);
		expect(watchStatusDelta('watched')).toBe(1);
	});

	it('filters by media type', () => {
		mediaWatchStore.seed('movie', MOVIE, 'none');
		mediaWatchStore.seed('tv', SHOW, 'none');

		mediaWatchStore.set('movie', MOVIE, 'watched');
		mediaWatchStore.set('tv', SHOW, 'watched');

		expect(watchStatusDelta('watched', 'movie')).toBe(1);
		expect(watchStatusDelta('watched', 'tv')).toBe(1);
		expect(watchStatusDelta('watched')).toBe(2);
	});

	it('cancels out when the entry returns to its server status', () => {
		mediaWatchStore.seed('movie', MOVIE, 'to_watch');

		mediaWatchStore.set('movie', MOVIE, 'watched');
		mediaWatchStore.set('movie', MOVIE, 'to_watch');

		expect(watchStatusDelta('to_watch')).toBe(0);
		expect(watchStatusDelta('watched')).toBe(0);
	});
});
