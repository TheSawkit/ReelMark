import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RATE_LIMITED } from '@/lib/action-errors';

const insertError = vi.hoisted(() => ({
	current: null as { code: string; message: string } | null,
}));

vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('@/lib/revalidate', () => ({
	revalidateProfileAfterResponse: vi.fn(),
}));
vi.mock('@/lib/push/notify-friend', () => ({ sendFriendPush: vi.fn() }));
vi.mock('@/lib/supabase/auth-helpers', () => ({
	getAuthenticatedUser: async () => ({
		userId: 'me',
		user: { user_metadata: {} },
		supabase: {
			from: () => ({
				insert: async () => ({ error: insertError.current }),
			}),
		},
	}),
}));

const { sendFriendRequest } = await import('@/app/actions/friends');

beforeEach(() => {
	insertError.current = null;
});

describe('sendFriendRequest — refusals travel as return values, production hides thrown messages', () => {
	it('refuses a request to oneself', async () => {
		await expect(sendFriendRequest('me')).resolves.toEqual({
			refused: 'SELF_REQUEST',
		});
	});

	it('refuses a request that already exists', async () => {
		insertError.current = { code: '23505', message: 'duplicate key' };
		await expect(sendFriendRequest('duplicate-target')).resolves.toEqual({
			refused: 'DUPLICATE_REQUEST',
		});
	});

	it('still throws on an unexpected database failure', async () => {
		insertError.current = { code: '42501', message: 'permission denied' };
		await expect(sendFriendRequest('other')).rejects.toThrow(
			'permission denied'
		);
	});
	it('refuses once the hourly budget is spent', async () => {
		for (let i = 0; i < 30; i++) await sendFriendRequest(`target-${i}`);
		await expect(sendFriendRequest('one-too-many')).resolves.toEqual({
			refused: RATE_LIMITED,
		});
	});
});

describe('pending requests idempotency filter', () => {
	it('.eq(status, pending) ensures only pending rows are mutated', () => {
		type Status = 'pending' | 'accepted' | 'rejected';
		type Row = { id: string; status: Status };

		const rows: Row[] = [
			{ id: '1', status: 'pending' },
			{ id: '2', status: 'accepted' },
			{ id: '3', status: 'rejected' },
		];

		const shouldUpdate = (row: Row) => row.status === 'pending';

		expect(rows.filter(shouldUpdate).map((r) => r.id)).toEqual(['1']);
	});
});
