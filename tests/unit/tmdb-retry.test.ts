import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('next/cache', () => ({ cacheLife: () => {} }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/i18n/server', () => ({
	getServerLocale: async () => 'en-US',
	getServerLanguage: async () => 'en',
}));
vi.stubEnv('TMDB_READ_ACCESS_TOKEN', 'test-token');

const { fetchTMDB } = await import('@/lib/tmdb/client');

describe('fetchTMDB retry on 429', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	/** Un "use cache" dispose de 50 s pour se remplir pendant un prérendu : un Retry-After suivi à la lettre faisait tomber la page en 500. */
	it('caps a long Retry-After so the cache fill stays within its budget', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(null, {
					status: 429,
					headers: { 'retry-after': '120' },
				})
			)
			.mockResolvedValueOnce(Response.json({ id: 550 }));
		vi.stubGlobal('fetch', fetchMock);

		const pending = fetchTMDB<{ id: number }>(
			'/movie/550',
			{},
			{ lang: 'en' }
		);
		await vi.advanceTimersByTimeAsync(5_000);

		await expect(pending).resolves.toEqual({ id: 550 });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
