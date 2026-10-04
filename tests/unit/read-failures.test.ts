import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
	createClient: vi.fn(),
	createAdminClient: vi.fn(),
}));
vi.mock('@/lib/report', () => ({
	reportSwallowed: vi.fn(),
	reportCritical: vi.fn(),
}));
vi.mock('@/lib/tmdb', () => ({ getListMediaMetadata: vi.fn() }));

const { getUserReviewSignals } = await import('@/lib/data/reviews');
const { loadUserMarks } = await import('@/lib/data/taste');
const { deleteWatchlistEntry } = await import('@/lib/data/watchlist-writes');

const failure = { data: null, error: { message: 'payment required' } };

function clientAnswering(answer: (table: string) => unknown) {
	return {
		from(table: string) {
			const query = {
				select: () => query,
				eq: () => query,
				in: () => query,
				not: () => query,
				order: () => query,
				range: async () => answer(table),
				delete: () => query,
				then: (resolve: (value: unknown) => void) =>
					resolve(answer(table)),
			};
			return query;
		},
	} as never;
}

describe('reads that feed a cache or a decision fail loudly', () => {
	it('getUserReviewSignals rejects instead of returning a taste without ratings', async () => {
		await expect(
			getUserReviewSignals(
				'u1',
				clientAnswering(() => failure)
			)
		).rejects.toThrow('payment required');
	});

	it('loadUserMarks rejects instead of answering "not in your library"', async () => {
		await expect(
			loadUserMarks(
				clientAnswering(() => failure),
				'u1',
				[{ id: 1, media_type: 'movie' }]
			)
		).rejects.toThrow('payment required');
	});

	it('removing a show fails when its episode progress cannot be deleted', async () => {
		const client = clientAnswering((table) =>
			table === 'episode_watches' ? failure : { data: null, error: null }
		);
		await expect(
			deleteWatchlistEntry(client, 'u1', 1399, 'tv')
		).rejects.toThrow('payment required');
	});
});
