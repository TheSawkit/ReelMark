import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
const getUserById = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
	createAdminClient: () => ({ auth: { admin: { getUserById } } }),
}));
vi.mock('@/lib/report', () => ({ reportSwallowed: vi.fn() }));
vi.mock('@/lib/push/send', () => ({ sendPushToUser: vi.fn() }));

const { recipientLanguage } = await import('@/lib/push/notify-friend');

beforeEach(() => getUserById.mockReset());

describe('recipientLanguage', () => {
	it('reads an account once for every push of the same window', async () => {
		getUserById.mockResolvedValue({
			data: { user: { user_metadata: { language: 'fr' } } },
			error: null,
		});

		expect(await recipientLanguage('cached-user')).toBe('fr');
		expect(await recipientLanguage('cached-user')).toBe('fr');
		expect(getUserById).toHaveBeenCalledOnce();
	});

	it('falls back to the default language when the account cannot be read', async () => {
		getUserById.mockResolvedValue({
			data: { user: null },
			error: { message: 'payment required' },
		});

		expect(await recipientLanguage('unreadable-user')).toBe('en');
	});
});
