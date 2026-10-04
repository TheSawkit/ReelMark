import { describe, it, expect, vi } from 'vitest';
import type { WatchlistEntry } from '@/types/tmdb';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ cacheLife: () => {}, cacheTag: () => {} }));
vi.mock('@/lib/supabase/server', () => ({
	createClient: vi.fn(),
	createAdminClient: vi.fn(),
}));
vi.mock('@/lib/report', () => ({ reportSwallowed: vi.fn() }));

const { createWatchlistEntryLoader } = await import('@/lib/data/watchlist');
const { mayHaveReviews } = await import('@/lib/data/review-index');
const { toShellState, EMPTY_SHELL_STATE } = await import('@/lib/data/prompts');
const { sessionUserFromClaims } = await import('@/lib/supabase/session-user');

function entry(
	media_id: number,
	media_type: 'movie' | 'tv' = 'movie'
): WatchlistEntry {
	return {
		media_id,
		media_type,
		media_title: `Title ${media_id}`,
		poster_path: null,
		status: 'to_watch',
		created_at: '2026-09-01T00:00:00Z',
		total_episodes: null,
		release_date: null,
		genre_ids: null,
	};
}

describe('createWatchlistEntryLoader', () => {
	/** Les sections d'une page se résolvent presque ensemble : une requête pour toutes, pas une par section. */
	it('answers concurrent callers with a single query', async () => {
		const fetchEntries = vi.fn(async (ids: number[]) =>
			ids.filter((id) => id % 2 === 0).map((id) => entry(id))
		);
		const load = createWatchlistEntryLoader(fetchEntries);

		const [first, second] = await Promise.all([
			load([1, 2, 3]),
			load([4, 5]),
		]);

		expect(fetchEntries).toHaveBeenCalledTimes(1);
		expect(fetchEntries.mock.calls[0][0].sort()).toEqual([1, 2, 3, 4, 5]);
		expect(first.map((e) => e.media_id)).toEqual([2]);
		expect(second.map((e) => e.media_id)).toEqual([4]);
	});

	it('never asks twice for an id it already resolved', async () => {
		const fetchEntries = vi.fn(async (ids: number[]) =>
			ids.map((id) => entry(id))
		);
		const load = createWatchlistEntryLoader(fetchEntries);

		await load([10, 11]);
		const again = await load([11, 12]);

		expect(fetchEntries).toHaveBeenCalledTimes(2);
		expect(fetchEntries.mock.calls[1][0]).toEqual([12]);
		expect(again.map((e) => e.media_id).sort()).toEqual([11, 12]);
	});

	/** Un film et une série peuvent partager un id TMDB : les deux lignes reviennent. */
	it('returns every media type stored under the same id', async () => {
		const load = createWatchlistEntryLoader(async () => [
			entry(7, 'movie'),
			entry(7, 'tv'),
		]);

		const entries = await load([7, 7]);

		expect(entries.map((e) => e.media_type).sort()).toEqual([
			'movie',
			'tv',
		]);
	});

	it('rejects every waiting caller when the query fails', async () => {
		const load = createWatchlistEntryLoader(async () => {
			throw new Error('402');
		});

		await expect(load([1])).rejects.toThrow('402');
	});
});

describe('mayHaveReviews', () => {
	const sets = {
		movies: new Set([550]),
		shows: new Set([1399]),
		episodeShows: new Set([1399]),
	};

	it('lets through only the titles someone rated or reviewed', () => {
		expect(mayHaveReviews(sets, 'movie', 550)).toBe(true);
		expect(mayHaveReviews(sets, 'movie', 551)).toBe(false);
		expect(mayHaveReviews(sets, 'tv', 1399)).toBe(true);
		expect(mayHaveReviews(sets, 'tv', 550)).toBe(false);
	});

	/** Index illisible = base injoignable : inutile d'envoyer trois RPC qui échoueront aussi. */
	it('skips the anonymous reads when the index is unavailable', () => {
		expect(mayHaveReviews(null, 'movie', 550)).toBe(false);
		expect(mayHaveReviews(null, 'episode', 1)).toBe(false);
	});

	it('does not gate episode ids, which the index keys by show', () => {
		expect(mayHaveReviews(sets, 'episode', 123456)).toBe(true);
	});
});

describe('toShellState', () => {
	it('maps the my_shell_state row', () => {
		expect(
			toShellState({
				unread_notifications: 3,
				avatar_url: 'https://x.supabase.co/a.webp',
				profile_created_at: '2026-05-21T15:39:07.898807+00:00',
				watchlist_count: 2078,
				has_streaming_providers: true,
				prompts: { import: 'dismissed', streaming: 'done' },
			})
		).toEqual({
			unreadCount: 3,
			avatarUrl: 'https://x.supabase.co/a.webp',
			accountCreatedAt: Date.parse('2026-05-21T15:39:07.898807+00:00'),
			watchlistCount: 2078,
			hasStreamingProviders: true,
			promptStates: { import: 'dismissed', streaming: 'done' },
		});
	});

	it('drops unknown prompt keys and states', () => {
		const shell = toShellState({
			unread_notifications: 0,
			avatar_url: null,
			profile_created_at: null,
			watchlist_count: 0,
			has_streaming_providers: false,
			prompts: { import: 'maybe', legacy: 'done', push: 'done' },
		});
		expect(shell.promptStates).toEqual({ push: 'done' });
		expect(shell.accountCreatedAt).toBeNull();
	});

	it('falls back to an empty shell without a row', () => {
		expect(toShellState(undefined)).toBe(EMPTY_SHELL_STATE);
	});
});

describe('sessionUserFromClaims', () => {
	it('keeps what the app reads from a verified token', () => {
		expect(
			sessionUserFromClaims({
				iss: 'https://x.supabase.co/auth/v1',
				sub: '844bf9f5-5cd6-42c5-b870-d14bf3f2c38d',
				aud: 'authenticated',
				exp: 0,
				iat: 0,
				role: 'authenticated',
				aal: 'aal1',
				session_id: 's',
				email: 'user@example.com',
				user_metadata: { username: 'sawkit', region: 'BE' },
				app_metadata: { provider: 'email' },
			})
		).toEqual({
			id: '844bf9f5-5cd6-42c5-b870-d14bf3f2c38d',
			email: 'user@example.com',
			user_metadata: { username: 'sawkit', region: 'BE' },
			app_metadata: { provider: 'email' },
		});
	});

	it('names no user without claims', () => {
		expect(sessionUserFromClaims(null)).toBeNull();
		expect(sessionUserFromClaims(undefined)).toBeNull();
	});
});
