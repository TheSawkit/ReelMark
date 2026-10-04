import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	generateMcpKey,
	hashMcpKey,
	isMcpKeyFormat,
	mcpKeyAccess,
} from '@/lib/mcp/keys';
import { cachedUserContext, cachedUserTaste } from '@/lib/mcp/user-cache';
import type { UserTaste } from '@/lib/data/taste';
import {
	toAssistantDetails,
	toAssistantEntry,
	toAssistantTitle,
	type AssistantFormat,
} from '@/lib/mcp/format';
import type {
	MediaItem,
	MovieDetails,
	TvShowDetails,
	WatchlistEntry,
} from '@/types/tmdb';

const format: AssistantFormat = {
	genres: { 18: 'Drame', 53: 'Thriller' },
	link: (type, id) => `https://reelmark.test/fr/${type}/${id}`,
};

function item(overrides: Partial<MediaItem> = {}): MediaItem {
	return {
		id: 146233,
		media_type: 'movie',
		title: 'Prisoners',
		original_title: 'Prisoners',
		overview: 'Un père cherche sa fille.',
		poster_path: null,
		backdrop_path: null,
		release_date: '2013-09-20',
		vote_average: 8.1234,
		vote_count: 100,
		popularity: 10,
		genre_ids: [18, 53, 9999],
		...overrides,
	};
}

describe('MCP link keys', () => {
	it('generates a url-safe 256-bit secret whose stored hash is not the secret', () => {
		for (const access of ['read', 'write'] as const) {
			const { key, hash } = generateMcpKey(access);
			expect(isMcpKeyFormat(key)).toBe(true);
			expect(hash).toBe(hashMcpKey(key));
			expect(hash).not.toContain(key);
			expect(hash).toMatch(/^[0-9a-f]{64}$/);
		}
	});

	it('never generates the same secret twice', () => {
		expect(generateMcpKey('read').key).not.toBe(generateMcpKey('read').key);
	});

	it('binds the access to the secret itself', () => {
		const read = generateMcpKey('read');
		const write = generateMcpKey('write');

		expect(mcpKeyAccess(read.key)).toBe('read');
		expect(mcpKeyAccess(write.key)).toBe('write');
		expect(hashMcpKey(`rw-${read.key}`)).not.toBe(read.hash);
		expect(mcpKeyAccess('a'.repeat(43))).toBe('read');
		expect(mcpKeyAccess(`rw-${'a'.repeat(40)}`)).toBe('read');
	});

	it('rejects malformed path segments before any lookup', () => {
		expect(isMcpKeyFormat('')).toBe(false);
		expect(isMcpKeyFormat('short')).toBe(false);
		expect(isMcpKeyFormat(`${'a'.repeat(42)}/`)).toBe(false);
		expect(isMcpKeyFormat('a'.repeat(44))).toBe(false);
		expect(isMcpKeyFormat(`rw.${'a'.repeat(43)}`)).toBe(false);
		expect(isMcpKeyFormat(`rw-${'a'.repeat(43)}`)).toBe(true);
	});

	it('keeps write links clear of the file-extension rewrite in next.config', () => {
		expect(generateMcpKey('write').key).not.toContain('.');
	});
});

describe('toAssistantTitle', () => {
	it('names genres, keeps one decimal, links to ReelMark and adds the user mark', () => {
		expect(
			toAssistantTitle(item(), format, { status: 'watched', rating: 9 })
		).toEqual({
			id: 146233,
			type: 'movie',
			title: 'Prisoners',
			year: '2013',
			genres: ['Drame', 'Thriller'],
			tmdbRating: 8.1,
			url: 'https://reelmark.test/fr/movie/146233',
			overview: 'Un père cherche sa fille.',
			because: undefined,
			status: 'watched',
			myRating: 9,
		});
	});

	it('shortens long synopses and drops empty ones', () => {
		const long = toAssistantTitle(
			item({ overview: 'x'.repeat(500) }),
			format
		);
		expect(long.overview).toHaveLength(280);
		expect(long.overview?.endsWith('…')).toBe(true);
		expect(toAssistantTitle(item({ overview: '' }), format).overview).toBe(
			undefined
		);
	});

	it('reports an unrated title as null rather than 0', () => {
		expect(
			toAssistantTitle(item({ vote_average: 0 }), format).tmdbRating
		).toBe(null);
	});
});

describe('toAssistantEntry', () => {
	it('describes a library entry with its status and rating', () => {
		const entry: WatchlistEntry = {
			media_id: 1396,
			media_title: 'Breaking Bad',
			media_type: 'tv',
			poster_path: null,
			status: 'abandoned',
			created_at: '2026-01-02T00:00:00Z',
			total_episodes: 62,
			release_date: null,
			genre_ids: [18],
		};
		expect(toAssistantEntry(entry, format, 4)).toMatchObject({
			id: 1396,
			type: 'tv',
			year: null,
			genres: ['Drame'],
			status: 'abandoned',
			myRating: 4,
			url: 'https://reelmark.test/fr/tv/1396',
		});
	});
});

describe('toAssistantDetails', () => {
	const providers = {
		link: '',
		flatrate: [
			{
				provider_id: 8,
				provider_name: 'Netflix',
				logo_path: '',
				display_priority: 1,
			},
		],
	};

	it('gives a movie its runtime and where to stream it', () => {
		const movie = {
			id: 1,
			title: 'Zodiac',
			release_date: '2007-03-02',
			genres: [{ id: 53, name: 'Thriller' }],
			runtime: 157,
			vote_average: 7.7,
			overview: 'Enquête.',
			tagline: '',
		} as MovieDetails;
		expect(
			toAssistantDetails(movie, 'movie', providers, format)
		).toMatchObject({
			title: 'Zodiac',
			year: '2007',
			runtimeMinutes: 157,
			streaming: ['Netflix'],
			rent: [],
			tagline: undefined,
		});
	});

	it('gives a show its seasons and creators', () => {
		const show = {
			id: 2,
			name: 'Dark',
			first_air_date: '2017-12-01',
			genres: [{ id: 18, name: 'Drame' }],
			number_of_seasons: 3,
			number_of_episodes: 26,
			status: 'Ended',
			created_by: [{ name: 'Baran bo Odar' }],
			vote_average: 8.4,
			overview: '',
			tagline: '',
		} as TvShowDetails;
		expect(toAssistantDetails(show, 'tv', null, format)).toMatchObject({
			title: 'Dark',
			seasons: 3,
			episodes: 26,
			showStatus: 'Ended',
			createdBy: ['Baran bo Odar'],
			streaming: [],
		});
	});
});

describe('cachedUserTaste', () => {
	const taste: UserTaste = {
		entries: [],
		profile: { ratings: {}, ratedAt: {}, episodesWatched: {} },
		dismissals: [],
	};

	afterEach(() => {
		vi.useRealTimers();
	});

	it('loads a library once for a burst of tool calls, then again after two minutes', async () => {
		vi.useFakeTimers();
		const load = vi.fn(async () => taste);

		await Promise.all([
			cachedUserTaste.get('burst-user', load),
			cachedUserTaste.get('burst-user', load),
		]);
		vi.advanceTimersByTime(119_000);
		await cachedUserTaste.get('burst-user', load);
		expect(load).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(2_000);
		await cachedUserTaste.get('burst-user', load);
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('never caches a failed load', async () => {
		const failing = vi.fn(async (): Promise<UserTaste> => {
			throw new Error('supabase down');
		});
		await expect(
			cachedUserTaste.get('failing-user', failing)
		).rejects.toThrow();

		const load = vi.fn(async () => taste);
		await cachedUserTaste.get('failing-user', load);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('keeps at most ten libraries in memory, evicting the oldest', async () => {
		const first = vi.fn(async () => taste);
		await cachedUserTaste.get('capped-0', first);
		for (let i = 1; i <= 10; i++) {
			await cachedUserTaste.get(`capped-${i}`, async () => taste);
		}
		await cachedUserTaste.get('capped-0', first);
		expect(first).toHaveBeenCalledTimes(2);
	});
});

describe('cachedUserContext', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('reads language and region once per ten minutes', async () => {
		vi.useFakeTimers();
		const load = vi.fn(async () => ({ lang: 'fr' as const, region: 'BE' }));

		await cachedUserContext.get('context-user', load);
		vi.advanceTimersByTime(599_000);
		await cachedUserContext.get('context-user', load);
		expect(load).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(2_000);
		await cachedUserContext.get('context-user', load);
		expect(load).toHaveBeenCalledTimes(2);
	});
});
