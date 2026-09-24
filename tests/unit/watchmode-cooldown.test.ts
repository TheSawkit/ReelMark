import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('WATCHMODE_API_KEY', 'test-key');
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
const fetchMock = vi.fn(async () => new Response(null, { status: 429 }));
vi.stubGlobal('fetch', fetchMock);

const { getWatchmodeProviders } = await import('@/lib/watchmode/providers');

describe('getWatchmodeProviders', () => {
	it('stops calling Watchmode while the quota cooldown is open', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(await getWatchmodeProviders(550, 'movie', 'BE')).toBeNull();
		const callsAfterQuotaHit = fetchMock.mock.calls.length;
		expect(await getWatchmodeProviders(550, 'movie', 'BE')).toBeNull();

		expect(fetchMock).toHaveBeenCalledTimes(callsAfterQuotaHit);
		expect(warn).toHaveBeenCalledOnce();
	});
});
