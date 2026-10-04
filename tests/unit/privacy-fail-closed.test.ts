import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
const maybeSingle = vi.fn();
const query = { select: () => query, eq: () => query, maybeSingle };
vi.mock('@/lib/supabase/server', () => ({
	createClient: async () => ({ from: () => query }),
}));
const reportSwallowed = vi.fn();
vi.mock('@/lib/report', () => ({ reportSwallowed }));

const { getPrivacySettings } = await import('@/lib/data/profile');

beforeEach(() => {
	maybeSingle.mockReset();
	reportSwallowed.mockReset();
});

describe('getPrivacySettings', () => {
	it('keeps the documented all-public default when the user never saved settings', async () => {
		maybeSingle.mockResolvedValue({ data: null, error: null });
		const settings = await getPrivacySettings('owner');
		expect(settings.friends_visibility).toBe('public');
		expect(reportSwallowed).not.toHaveBeenCalled();
	});

	it('treats every section as private when the settings cannot be read', async () => {
		maybeSingle.mockResolvedValue({
			data: null,
			error: { message: 'payment required' },
		});
		const settings = await getPrivacySettings('owner');
		expect(settings).toMatchObject({
			watchlist_visibility: 'private',
			watched_visibility: 'private',
			reviews_visibility: 'private',
			playlists_visibility: 'private',
			friends_visibility: 'private',
		});
		expect(reportSwallowed).toHaveBeenCalledOnce();
	});
});
