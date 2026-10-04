import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
const sendNotification = vi.fn();
vi.mock('web-push', () => ({
	default: { setVapidDetails: vi.fn(), sendNotification },
}));
const result = vi.fn();
const query = {
	select: () => query,
	eq: () => query,
	in: () => query,
	maybeSingle: () => result(),
	then: (resolve: (value: unknown) => void) => resolve(result()),
};
vi.mock('@/lib/supabase/server', () => ({
	createAdminClient: () => ({ from: () => query }),
}));
vi.mock('@/lib/report', () => ({ reportSwallowed: vi.fn() }));
const fetchAllRows = vi.fn();
vi.mock('@/lib/supabase/pagination', () => ({ fetchAllRows }));
vi.mock('@/lib/tmdb/tv', () => ({
	getTvShowDetails: async () => ({
		last_episode_to_air: {
			air_date: '2026-10-03',
			season_number: 1,
			episode_number: 2,
		},
	}),
}));

process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public';
process.env.VAPID_PRIVATE_KEY = 'private';
process.env.VAPID_SUBJECT = 'mailto:test@reelmark.test';

const { sendPushToUser } = await import('@/lib/push/send');
const { announceNewEpisodes } = await import('@/lib/push/notify-new-episodes');

const failure = { data: null, error: { message: 'payment required' } };

beforeEach(() => {
	sendNotification.mockReset();
	result.mockReset();
	fetchAllRows.mockReset();
});

describe('push delivery fails closed', () => {
	it('sends nothing when the preferences cannot be read', async () => {
		result.mockReturnValueOnce(failure).mockReturnValue({
			data: [{ endpoint: 'https://push.test', p256dh: 'k', auth: 'a' }],
			error: null,
		});

		await sendPushToUser('u1', 'suggestion', {
			title: 't',
			body: 'b',
			url: '/',
		});

		expect(sendNotification).not.toHaveBeenCalled();
	});

	it('notifies nobody again when the already-sent check fails', async () => {
		fetchAllRows
			.mockResolvedValueOnce([
				{
					user_id: 'u1',
					media_id: 7,
					media_title: 'Show',
					poster_path: null,
				},
			])
			.mockResolvedValueOnce([]);
		result.mockReturnValue(failure);

		const outcome = await announceNewEpisodes('2026-10-04', true);

		expect(outcome.notified).toBe(0);
	});
});
