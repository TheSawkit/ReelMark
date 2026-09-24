import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const announceNewEpisodes = vi.fn(async () => ({
	shows: 1,
	freshEpisodes: 1,
	notified: 1,
}));
vi.mock('@/lib/push/notify-new-episodes', () => ({ announceNewEpisodes }));

const { POST } = await import('@/app/api/cron/new-episodes/route');

function call(authorization?: string, query = '') {
	return POST(
		new Request(`http://localhost/api/cron/new-episodes${query}`, {
			method: 'POST',
			headers: authorization ? { authorization } : {},
		})
	);
}

describe('POST /api/cron/new-episodes', () => {
	beforeEach(() => announceNewEpisodes.mockClear());
	afterEach(() => vi.unstubAllEnvs());

	it('refuses every call when no secret is configured', async () => {
		vi.stubEnv('CRON_SECRET', '');
		expect((await call('Bearer ')).status).toBe(401);
		expect(announceNewEpisodes).not.toHaveBeenCalled();
	});

	it('refuses a wrong or missing secret', async () => {
		vi.stubEnv('CRON_SECRET', 'right-secret');
		expect((await call('Bearer wrong-secret')).status).toBe(401);
		expect((await call()).status).toBe(401);
		expect(announceNewEpisodes).not.toHaveBeenCalled();
	});

	it('runs with the right secret and honours dryRun', async () => {
		vi.stubEnv('CRON_SECRET', 'right-secret');
		const res = await call('Bearer right-secret', '?dryRun=1');
		expect(res.status).toBe(200);
		expect(announceNewEpisodes).toHaveBeenCalledWith(
			expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
			true
		);
	});
});
