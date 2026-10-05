import { describe, expect, it } from 'vitest';
import {
	movieJsonLd,
	movieSeriesJsonLd,
	personJsonLd,
	serializeJsonLd,
	tvSeasonJsonLd,
	tvSeriesJsonLd,
} from '@/lib/structured-data';
import type {
	CollectionDetails,
	Credits,
	CrewDetails,
	MovieDetails,
	SeasonDetails,
	TvShowDetails,
} from '@/types/tmdb';

const tv = {
	id: 1399,
	name: 'Game of Thrones',
	poster_path: '/show.jpg',
} as TvShowDetails;

const season = {
	id: 1,
	name: 'Season 1',
	overview: 'Winter is coming.',
	poster_path: null,
	season_number: 1,
	episode_count: 2,
	air_date: '2011-04-17',
	episodes: [
		{ name: 'Winter Is Coming', episode_number: 1, air_date: '2011-04-17' },
		{ name: 'The Kingsroad', episode_number: 2, air_date: null },
	],
} as SeasonDetails;

describe('tvSeasonJsonLd', () => {
	const data = tvSeasonJsonLd(tv, season, 'en');

	it('links the season to its series', () => {
		expect(data.partOfSeries).toMatchObject({
			'@type': 'TVSeries',
			name: 'Game of Thrones',
		});
		expect(data.url).toMatch(/\/en\/tv\/1399\/season\/1$/);
	});

	it('lists every episode and falls back to the show poster', () => {
		expect(data.numberOfEpisodes).toBe(2);
		expect(data.episode).toHaveLength(2);
		expect(data.image).toContain('/show.jpg');
	});
});

describe('personJsonLd', () => {
	const crew = {
		id: 287,
		name: 'Brad Pitt',
		biography: 'x'.repeat(500),
		birthday: '1963-12-18',
		deathday: null,
		place_of_birth: 'Shawnee, Oklahoma, USA',
		profile_path: '/brad.jpg',
		also_known_as: [],
	} as unknown as CrewDetails;

	it('keeps known facts, bounds the description and omits the unknown', () => {
		const data = personJsonLd(crew, 'fr');
		expect(data['@type']).toBe('Person');
		expect(data.birthDate).toBe('1963-12-18');
		expect(data.birthPlace).toMatchObject({ '@type': 'Place' });
		expect(String(data.description)).toHaveLength(300);
		expect(data).not.toHaveProperty('deathDate');
		expect(data).not.toHaveProperty('alternateName');
	});
});

describe('movieSeriesJsonLd', () => {
	it('lists the films of the saga as parts', () => {
		const collection = {
			id: 10,
			name: 'Star Wars Collection',
			overview: null,
			poster_path: null,
			backdrop_path: null,
			parts: [{ id: 11, title: 'Star Wars', release_date: '1977-05-25' }],
		} as unknown as CollectionDetails;
		const data = movieSeriesJsonLd(collection, 'en');
		expect(data['@type']).toBe('MovieSeries');
		expect(data.hasPart).toEqual([
			expect.objectContaining({ '@type': 'Movie', name: 'Star Wars' }),
		]);
	});
});

describe('serializeJsonLd', () => {
	it('escapes < so a title cannot close the script tag', () => {
		expect(serializeJsonLd({ name: '</script>' })).not.toContain(
			'</script>'
		);
	});
});

describe('movieJsonLd / tvSeriesJsonLd', () => {
	const credits = { cast: [], crew: [] } as unknown as Credits;

	it('carry no TMDB rating — Google forbids ratings aggregated from other sites', () => {
		const movie = {
			id: 550,
			title: 'Fight Club',
			genres: [],
			vote_average: 8.4,
			vote_count: 30000,
		} as unknown as MovieDetails;
		const show = {
			...tv,
			genres: [],
			created_by: [],
			vote_average: 9.2,
			vote_count: 25000,
		} as TvShowDetails;

		expect(movieJsonLd(movie, credits, 'en')).not.toHaveProperty(
			'aggregateRating'
		);
		expect(tvSeriesJsonLd(show, credits, 'en')).not.toHaveProperty(
			'aggregateRating'
		);
	});
});
