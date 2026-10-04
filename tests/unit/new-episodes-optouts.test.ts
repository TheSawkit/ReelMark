import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: () => ({}) }));
const fetchAllRows = vi.fn();
vi.mock('@/lib/supabase/pagination', () => ({ fetchAllRows }));
vi.mock('@/lib/push/send', () => ({ sendPushToUser: vi.fn() }));
vi.mock('@/lib/tmdb/tv', () => ({ getTvShowDetails: vi.fn() }));

const { announceNewEpisodes } = await import('@/lib/push/notify-new-episodes');

describe('announceNewEpisodes', () => {
	it('fails instead of notifying opted-out accounts when their preferences cannot be read', async () => {
		fetchAllRows
			.mockResolvedValueOnce([
				{
					user_id: 'u1',
					media_id: 1,
					media_title: 'Show',
					poster_path: null,
				},
			])
			.mockRejectedValueOnce(new Error('payment required'));

		await expect(announceNewEpisodes('2026-10-04', true)).rejects.toThrow(
			'payment required'
		);
	});
});
