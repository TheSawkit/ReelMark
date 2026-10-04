import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const announceNewEpisodes = vi.fn(async () => ({
	shows: 1,
	freshEpisodes: 1,
	notified: 1,
}));
const sendWeeklySuggestions = vi.fn(async () => ({
	users: 1,
	suggested: 1,
	nextCursor: null,
}));
vi.mock('@/lib/push/notify-new-episodes', () => ({ announceNewEpisodes }));
vi.mock('@/lib/push/notify-suggestions', () => ({ sendWeeklySuggestions }));

const routes = [
	{
		path: 'new-episodes',
		job: announceNewEpisodes,
		module: await import('@/app/api/cron/new-episodes/route'),
	},
	{
		path: 'suggestions',
		job: sendWeeklySuggestions,
		module: await import('@/app/api/cron/suggestions/route'),
	},
];

for (const { path, job, module } of routes) {
	function call(authorization?: string, query = '') {
		return module.POST(
			new Request(`http://localhost/api/cron/${path}${query}`, {
				method: 'POST',
				headers: authorization ? { authorization } : {},
			})
		);
	}

	describe(`POST /api/cron/${path}`, () => {
		beforeEach(() => job.mockClear());
		afterEach(() => vi.unstubAllEnvs());

		it('refuses every call when no secret is configured', async () => {
			vi.stubEnv('CRON_SECRET', '');
			expect((await call('Bearer ')).status).toBe(401);
			expect(job).not.toHaveBeenCalled();
		});

		it('refuses a wrong or missing secret', async () => {
			vi.stubEnv('CRON_SECRET', 'right-secret');
			expect((await call('Bearer wrong-secret')).status).toBe(401);
			expect((await call()).status).toBe(401);
			expect(job).not.toHaveBeenCalled();
		});

		it('runs with the right secret and honours dryRun', async () => {
			vi.stubEnv('CRON_SECRET', 'right-secret');
			const res = await call('Bearer right-secret', '?dryRun=1');
			expect(res.status).toBe(200);
			expect(job.mock.calls[0]).toContain(true);
		});
	});
}

describe('POST /api/cron/suggestions — batches', () => {
	const { POST } = routes[1].module;
	const call = (query: string) =>
		POST(
			new Request(`http://localhost/api/cron/suggestions${query}`, {
				method: 'POST',
				headers: { authorization: 'Bearer right-secret' },
			})
		);

	beforeEach(() => {
		sendWeeklySuggestions.mockClear();
		vi.stubEnv('CRON_SECRET', 'right-secret');
	});
	afterEach(() => vi.unstubAllEnvs());

	it('resumes after the cursor of the previous batch', async () => {
		const cursor = '00000000-0000-0000-0000-000000000042';
		expect((await call(`?after=${cursor}`)).status).toBe(200);
		expect(sendWeeklySuggestions).toHaveBeenCalledWith(false, cursor);
	});

	it('refuses a cursor that is not an account id', async () => {
		expect((await call('?after=nope')).status).toBe(400);
		expect(sendWeeklySuggestions).not.toHaveBeenCalled();
	});
});
