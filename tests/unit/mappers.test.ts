import { describe, it, expect } from 'vitest';
import {
	watchlistEntryToMediaItem,
	movieCreditToMediaItem,
	tvCreditToMediaItem,
} from '@/lib/mappers';
import type {
	WatchlistEntry,
	ActorMovieCredit,
	ActorTvCredit,
} from '@/types/tmdb';

const baseWatchlistEntry: WatchlistEntry = {
	id: '1',
	user_id: 'user-abc',
	media_id: 550,
	media_type: 'movie',
	media_title: 'Fight Club',
	poster_path: '/poster.jpg',
	status: 'to_watch',
	created_at: '2024-01-01T00:00:00Z',
};

const baseMovieCredit: ActorMovieCredit = {
	id: 550,
	title: 'Fight Club',
	overview: 'An insomniac office worker forms an underground club.',
	poster_path: '/poster.jpg',
	backdrop_path: '/backdrop.jpg',
	release_date: '1999-10-15',
	vote_average: 8.4,
	popularity: 50,
	character: 'Narrator',
};

const baseTvCredit: ActorTvCredit = {
	id: 1399,
	name: 'Game of Thrones',
	overview: 'Seven noble families fight for control.',
	poster_path: '/got_poster.jpg',
	backdrop_path: '/got_backdrop.jpg',
	first_air_date: '2011-04-17',
	vote_average: 9.2,
	popularity: 100,
	character: 'Jon Snow',
};

describe('watchlistEntryToMediaItem', () => {
	it('maps id, media_type, title from watchlist fields', () => {
		const item = watchlistEntryToMediaItem(baseWatchlistEntry);
		expect(item.id).toBe(550);
		expect(item.media_type).toBe('movie');
		expect(item.title).toBe('Fight Club');
		expect(item.original_title).toBe('Fight Club');
		expect(item.poster_path).toBe('/poster.jpg');
	});

	it('sets empty/zero defaults for non-stored fields', () => {
		const item = watchlistEntryToMediaItem(baseWatchlistEntry);
		expect(item.overview).toBe('');
		expect(item.backdrop_path).toBeNull();
		expect(item.release_date).toBe('');
		expect(item.vote_average).toBe(0);
		expect(item.vote_count).toBe(0);
		expect(item.popularity).toBe(0);
	});

	it('preserves the original watchlistEntry reference', () => {
		const item = watchlistEntryToMediaItem(baseWatchlistEntry);
		expect(item.watchlistEntry).toBe(baseWatchlistEntry);
	});

	it('works with tv media_type', () => {
		const tvEntry: WatchlistEntry = {
			...baseWatchlistEntry,
			media_type: 'tv',
			media_title: 'Breaking Bad',
		};
		const item = watchlistEntryToMediaItem(tvEntry);
		expect(item.media_type).toBe('tv');
		expect(item.title).toBe('Breaking Bad');
	});
});

describe('movieCreditToMediaItem', () => {
	it('forces media_type to movie', () => {
		const item = movieCreditToMediaItem(baseMovieCredit);
		expect(item.media_type).toBe('movie');
	});

	it('maps all fields correctly', () => {
		const item = movieCreditToMediaItem(baseMovieCredit);
		expect(item.id).toBe(550);
		expect(item.title).toBe('Fight Club');
		expect(item.original_title).toBe('Fight Club');
		expect(item.overview).toBe(
			'An insomniac office worker forms an underground club.'
		);
		expect(item.poster_path).toBe('/poster.jpg');
		expect(item.backdrop_path).toBe('/backdrop.jpg');
		expect(item.release_date).toBe('1999-10-15');
		expect(item.vote_average).toBe(8.4);
		expect(item.vote_count).toBe(0);
		expect(item.popularity).toBe(50);
		expect(item.character).toBe('Narrator');
	});

	it('sets character to undefined when empty string', () => {
		const item = movieCreditToMediaItem({
			...baseMovieCredit,
			character: '',
		});
		expect(item.character).toBeUndefined();
	});
});

describe('tvCreditToMediaItem', () => {
	it('forces media_type to tv', () => {
		const item = tvCreditToMediaItem(baseTvCredit);
		expect(item.media_type).toBe('tv');
	});

	it('maps name to title and original_title', () => {
		const item = tvCreditToMediaItem(baseTvCredit);
		expect(item.title).toBe('Game of Thrones');
		expect(item.original_title).toBe('Game of Thrones');
	});

	it('maps first_air_date to release_date', () => {
		const item = tvCreditToMediaItem(baseTvCredit);
		expect(item.release_date).toBe('2011-04-17');
	});

	it('maps all other fields correctly', () => {
		const item = tvCreditToMediaItem(baseTvCredit);
		expect(item.id).toBe(1399);
		expect(item.overview).toBe('Seven noble families fight for control.');
		expect(item.poster_path).toBe('/got_poster.jpg');
		expect(item.backdrop_path).toBe('/got_backdrop.jpg');
		expect(item.vote_average).toBe(9.2);
		expect(item.vote_count).toBe(0);
		expect(item.popularity).toBe(100);
		expect(item.character).toBe('Jon Snow');
	});

	it('sets character to undefined when empty string', () => {
		const item = tvCreditToMediaItem({ ...baseTvCredit, character: '' });
		expect(item.character).toBeUndefined();
	});
});
