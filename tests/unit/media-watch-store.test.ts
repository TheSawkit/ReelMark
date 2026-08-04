import { describe, it, expect, beforeEach } from 'vitest';
import { mediaWatchStore } from '@/lib/stores/media-watch';

const MOVIE_ID = 603;

describe('mediaWatchStore.seed', () => {
	beforeEach(() => {
		mediaWatchStore.restore('movie', MOVIE_ID, undefined);
	});

	it('stores the server status as clean', () => {
		mediaWatchStore.seed('movie', MOVIE_ID, 'to_watch');

		expect(mediaWatchStore.get('movie', MOVIE_ID)).toEqual({
			status: 'to_watch',
			dirty: false,
			baseStatus: 'to_watch',
		});
	});

	it('never overwrites a dirty entry with a stale server value', () => {
		mediaWatchStore.set('movie', MOVIE_ID, 'watched');

		mediaWatchStore.seed('movie', MOVIE_ID, 'to_watch');

		expect(mediaWatchStore.get('movie', MOVIE_ID)).toEqual({
			status: 'watched',
			dirty: true,
			baseStatus: 'none',
		});
	});

	it('refreshes a clean entry when the server status changes', () => {
		mediaWatchStore.seed('movie', MOVIE_ID, 'to_watch');

		mediaWatchStore.seed('movie', MOVIE_ID, 'watched');

		expect(mediaWatchStore.get('movie', MOVIE_ID)?.status).toBe('watched');
	});
});

describe('mediaWatchStore.set / restore', () => {
	beforeEach(() => {
		mediaWatchStore.restore('movie', MOVIE_ID, undefined);
	});

	it('marks a mutation as dirty', () => {
		mediaWatchStore.set('movie', MOVIE_ID, 'none');

		expect(mediaWatchStore.get('movie', MOVIE_ID)).toEqual({
			status: 'none',
			dirty: true,
			baseStatus: 'none',
		});
	});

	it('rolls back to the previous snapshot on failure', () => {
		mediaWatchStore.seed('movie', MOVIE_ID, 'to_watch');
		const previous = mediaWatchStore.get('movie', MOVIE_ID);

		mediaWatchStore.set('movie', MOVIE_ID, 'watched');
		mediaWatchStore.restore('movie', MOVIE_ID, previous);

		expect(mediaWatchStore.get('movie', MOVIE_ID)).toEqual({
			status: 'to_watch',
			dirty: false,
			baseStatus: 'to_watch',
		});
	});

	it('drops the entry when restoring an undefined snapshot', () => {
		mediaWatchStore.set('movie', MOVIE_ID, 'watched');

		mediaWatchStore.restore('movie', MOVIE_ID, undefined);

		expect(mediaWatchStore.get('movie', MOVIE_ID)).toBeUndefined();
	});

	it('keys movie and tv entries separately', () => {
		mediaWatchStore.set('movie', MOVIE_ID, 'watched');
		mediaWatchStore.set('tv', MOVIE_ID, 'to_watch');

		expect(mediaWatchStore.get('movie', MOVIE_ID)?.status).toBe('watched');
		expect(mediaWatchStore.get('tv', MOVIE_ID)?.status).toBe('to_watch');

		mediaWatchStore.restore('tv', MOVIE_ID, undefined);
	});
});
