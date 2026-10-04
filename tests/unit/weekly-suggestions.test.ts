import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: () => ({}) }));
const fetchAllRows = vi.fn();
vi.mock('@/lib/supabase/pagination', () => ({ fetchAllRows }));
vi.mock('@/lib/push/send', () => ({ sendPushToUser: vi.fn() }));
vi.mock('@/lib/push/notify-friend', () => ({ recipientLanguage: vi.fn() }));
vi.mock('@/lib/data/taste', () => ({
	loadUserTaste: vi.fn(),
	tasteOfType: vi.fn(),
}));
vi.mock('@/lib/recommendations/candidates', () => ({
	fetchSeedCandidates: vi.fn(),
}));

const { usersToSuggest, sendWeeklySuggestions } =
	await import('@/lib/push/notify-suggestions');

describe('usersToSuggest', () => {
	it('skips opted-out accounts and those already served this week', () => {
		expect(
			usersToSuggest(
				[{ user_id: 'a' }, { user_id: 'b' }, { user_id: 'c' }],
				[{ user_id: 'b' }, { user_id: 'c' }, { user_id: 'c' }]
			)
		).toEqual(['a']);
	});
});

describe('sendWeeklySuggestions', () => {
	it('fails instead of notifying nobody when an account read fails', async () => {
		fetchAllRows.mockRejectedValue(new Error('payment required'));
		await expect(sendWeeklySuggestions(true)).rejects.toThrow(
			'payment required'
		);
	});
});
