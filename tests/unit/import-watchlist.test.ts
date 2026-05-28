import { describe, it, expect } from 'vitest';
import { parseImportFile } from '@/lib/parsers/import-watchlist';

function makeFile(content: string, name: string): File {
	return new File([content], name, {
		type: name.endsWith('.json') ? 'application/json' : 'text/csv',
	});
}

describe('parseImportFile — Letterboxd CSV', () => {
	it('parses a diary export (rated/watched items)', async () => {
		const csv = [
			'Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date',
			'2024-01-15,"Dune: Part Two",2024,uri,4.5,No,,2024-01-15',
			'2024-02-10,"Oppenheimer",2023,uri,5,No,,2024-02-10',
		].join('\n');

		const items = await parseImportFile(
			makeFile(csv, 'diary.csv'),
			'letterboxd',
			'unknown'
		);

		expect(items).toHaveLength(2);
		expect(items[0]).toMatchObject({
			title: 'Dune: Part Two',
			year: 2024,
			status: 'watched',
			rating: 9,
			mediaType: 'movie',
		});
		expect(items[1]).toMatchObject({
			title: 'Oppenheimer',
			year: 2023,
			status: 'watched',
			rating: 10,
			mediaType: 'movie',
		});
	});

	it('parses a watchlist export (no rating, no watched date)', async () => {
		const csv = [
			'Date,Name,Year,Letterboxd URI',
			'2024-01-15,"Conclave",2024,uri',
		].join('\n');

		const items = await parseImportFile(
			makeFile(csv, 'watchlist.csv'),
			'letterboxd',
			'unknown'
		);

		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			title: 'Conclave',
			year: 2024,
			status: 'to_watch',
			rating: null,
			mediaType: 'movie',
		});
	});

	it("returns empty array for headers without 'name'", async () => {
		const csv = 'Year\n2024';
		const items = await parseImportFile(
			makeFile(csv, 'x.csv'),
			'letterboxd',
			'unknown'
		);
		expect(items).toEqual([]);
	});

	it('returns empty array for empty file', async () => {
		const items = await parseImportFile(
			makeFile('', 'x.csv'),
			'letterboxd',
			'unknown'
		);
		expect(items).toEqual([]);
	});
});

describe('parseImportFile — Trakt JSON', () => {
	it('parses movies/watched with tmdb id and last_watched_at', async () => {
		const json = JSON.stringify([
			{
				movie: { title: 'Inception', year: 2010, ids: { tmdb: 27205 } },
				last_watched_at: '2024-01-01',
			},
		]);
		const items = await parseImportFile(
			makeFile(json, 'movies-watched.json'),
			'trakt',
			'unknown'
		);
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			title: 'Inception',
			year: 2010,
			status: 'watched',
			tmdbId: 27205,
			mediaType: 'movie',
		});
	});

	it('parses shows/watched with tmdb id', async () => {
		const json = JSON.stringify([
			{
				show: {
					title: 'Breaking Bad',
					year: 2008,
					ids: { tmdb: 1396 },
				},
				last_watched_at: '2024-01-01',
			},
		]);
		const items = await parseImportFile(
			makeFile(json, 'shows-watched.json'),
			'trakt',
			'unknown'
		);
		expect(items[0]).toMatchObject({
			title: 'Breaking Bad',
			year: 2008,
			status: 'watched',
			tmdbId: 1396,
			mediaType: 'tv',
		});
	});

	it('marks watchlist items (no last_watched_at) as to_watch', async () => {
		const json = JSON.stringify([
			{
				movie: { title: 'Tenet', year: 2020, ids: { tmdb: 577922 } },
				listed_at: '2024-01-01',
			},
		]);
		const items = await parseImportFile(
			makeFile(json, 'watchlist.json'),
			'trakt',
			'unknown'
		);
		expect(items[0]).toMatchObject({ status: 'to_watch' });
	});

	it('skips entries without tmdb id', async () => {
		const json = JSON.stringify([
			{ movie: { title: 'No TMDB', ids: { imdb: 'tt0000000' } } },
		]);
		const items = await parseImportFile(
			makeFile(json, 'x.json'),
			'trakt',
			'unknown'
		);
		expect(items).toEqual([]);
	});
});

describe('parseImportFile — TV Time', () => {
	it('parses Refract series format with up_to_date status', async () => {
		const json = JSON.stringify([
			{
				title: 'Severance (2022)',
				status: 'up_to_date',
				seasons: [],
				id: { tvdb: 371980 },
			},
		]);
		const items = await parseImportFile(
			makeFile(json, 'series.json'),
			'tvtime',
			'unknown'
		);
		expect(items[0]).toMatchObject({
			title: 'Severance',
			year: 2022,
			status: 'watched',
			mediaType: 'tv',
			tvdbId: 371980,
		});
	});

	it('parses Refract movies with is_watched flag', async () => {
		const json = JSON.stringify([
			{
				title: 'Past Lives',
				year: 2023,
				is_watched: true,
				id: { imdb: 'tt13238346' },
			},
			{ title: 'Anatomy of a Fall', year: 2023, is_watched: false },
		]);
		const items = await parseImportFile(
			makeFile(json, 'movies.json'),
			'tvtime',
			'unknown'
		);
		expect(items[0]).toMatchObject({
			title: 'Past Lives',
			status: 'watched',
			imdbId: 'tt13238346',
		});
		expect(items[1]).toMatchObject({
			title: 'Anatomy of a Fall',
			status: 'to_watch',
		});
	});

	it('parses GDPR export format', async () => {
		const json = JSON.stringify({
			data: {
				objects: [
					{
						meta: {
							name: 'The Bear',
							first_release_date: '2022-06-23',
						},
					},
					{
						meta: {
							name: 'The Bear',
							first_release_date: '2022-06-23',
						},
					},
				],
			},
		});
		const items = await parseImportFile(
			makeFile(json, 'gdpr.json'),
			'tvtime',
			'unknown'
		);
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			title: 'The Bear',
			year: 2022,
			status: 'watched',
			mediaType: 'tv',
		});
	});

	it('falls back to legacy CSV when JSON parse fails', async () => {
		const csv = 'show_name,episode\nSuccession,S01E01\nSuccession,S01E02';
		const items = await parseImportFile(
			makeFile(csv, 'seen.csv'),
			'tvtime',
			'unknown'
		);
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			title: 'Succession',
			status: 'watched',
			mediaType: 'tv',
		});
	});
});
