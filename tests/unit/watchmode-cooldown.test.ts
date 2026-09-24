import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('WATCHMODE_API_KEY', 'test-key');
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
const fetchMock = vi.fn(async () => new Response(null, { status: 429 }));
vi.stubGlobal('fetch', fetchMock);

async function freshProviders() {
	vi.resetModules();
	return import('@/lib/watchmode/providers');
}

describe('getWatchmodeProviders', () => {
	beforeEach(() => {
		fetchMock.mockClear();
		vi.restoreAllMocks();
	});

	it('stops calling Watchmode while the quota cooldown is open', async () => {
		const { getWatchmodeProviders } = await freshProviders();

		expect(await getWatchmodeProviders(550, 'movie', 'BE')).toBeNull();
		const callsAfterQuotaHit = fetchMock.mock.calls.length;
		expect(await getWatchmodeProviders(550, 'movie', 'BE')).toBeNull();

		expect(fetchMock).toHaveBeenCalledTimes(callsAfterQuotaHit);
	});

	/** Bugsink groupe par transaction : chaque 429 devenait une issue par fiche (63 000 en prod). */
	it('keeps an exhausted quota out of the error tracker', async () => {
		const { getWatchmodeProviders } = await freshProviders();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(await getWatchmodeProviders(680, 'movie', 'BE')).toBeNull();

		expect(fetchMock).toHaveBeenCalled();
		expect(warn).not.toHaveBeenCalled();
	});
});
