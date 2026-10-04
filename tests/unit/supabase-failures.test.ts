import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const maybeSingle = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
	createAdminClient: () => ({
		from: () => ({
			select: () => ({ eq: () => ({ maybeSingle }) }),
		}),
	}),
}));
vi.mock('@/lib/report', () => ({ reportSwallowed: vi.fn() }));
vi.mock('@/lib/data/reviews', () => ({
	getUserReviewSignals: async () => ({ ratings: {}, ratedAt: {} }),
}));
vi.mock('@/lib/data/episodes', () => ({
	getUserTvWatchCounts: async () => ({}),
}));

const { resolveMcpKey } = await import('@/lib/data/mcp');
const { loadUserTaste } = await import('@/lib/data/taste');

const VALID_KEY = 'a'.repeat(43);

beforeEach(() => maybeSingle.mockReset());

describe('resolveMcpKey', () => {
	it('tells an unknown link apart from a database failure', async () => {
		maybeSingle.mockResolvedValue({ data: null, error: null });
		await expect(resolveMcpKey(VALID_KEY)).resolves.toBeNull();

		maybeSingle.mockResolvedValue({
			data: null,
			error: { message: 'quota exceeded' },
		});
		await expect(resolveMcpKey(VALID_KEY)).rejects.toThrow(
			'quota exceeded'
		);
	});
});

describe('loadUserTaste', () => {
	it('fails instead of returning a taste without the dismissed titles', async () => {
		const page = { data: [], error: null };
		const query = {
			select: () => query,
			eq: () => query,
			order: () => query,
			range: async () => page,
			then: (resolve: (value: unknown) => void) =>
				resolve({ data: null, error: { message: 'timeout' } }),
		};
		const client = { from: () => query };

		await expect(loadUserTaste(client as never, 'user-1')).rejects.toThrow(
			'timeout'
		);
	});
});
