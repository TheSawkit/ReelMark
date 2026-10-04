import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

type Result = { data: unknown[] | null; error: { message: string } | null };
const results = new Map<string, Result | Result[]>();
const calls: Array<{ table: string; gt?: string }> = [];

function builder(table: string) {
	const call: { table: string; gt?: string } = { table };
	calls.push(call);
	const query = {
		select: () => query,
		eq: () => query,
		in: () => query,
		gte: () => query,
		order: () => query,
		limit: () => query,
		gt: (_column: string, value: string) => {
			call.gt = value;
			return query;
		},
		then: (resolve: (value: Result) => void) => {
			const answer = results.get(table) ?? { data: [], error: null };
			resolve(
				Array.isArray(answer)
					? (answer.shift() ?? { data: [], error: null })
					: answer
			);
		},
	};
	return query;
}

vi.mock('@/lib/supabase/server', () => ({
	createAdminClient: () => ({ from: builder }),
}));
vi.mock('@/lib/push/send', () => ({ sendPushToUser: vi.fn() }));
vi.mock('@/lib/push/notify-friend', () => ({
	recipientLanguage: async () => 'en',
}));
vi.mock('@/lib/data/taste', () => ({
	loadUserTaste: async () => ({ entries: [], profile: {} }),
	tasteOfType: () => ({ entries: [{ media_id: 1 }], dismissals: [] }),
}));
vi.mock('@/lib/recommendations', () => ({
	pickSeeds: () => [],
	pickSuggestion: () => ({ id: 2, media_type: 'movie', title: 'Pick' }),
}));
vi.mock('@/lib/recommendations/candidates', () => ({
	fetchSeedCandidates: vi.fn(),
}));

const { usersToSuggest, sendWeeklySuggestions } =
	await import('@/lib/push/notify-suggestions');

const accounts = (count: number) =>
	Array.from({ length: count }, (_, i) => ({
		user_id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
	}));

beforeEach(() => {
	results.clear();
	calls.length = 0;
});

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
	it('hands back the last account of a full batch so the caller can resume after it', async () => {
		const batch = accounts(50);
		results.set('user_profiles', { data: batch, error: null });

		const result = await sendWeeklySuggestions(true, 'cursor-from-before');

		expect(result.nextCursor).toBe(batch[49].user_id);
		expect(calls.find((call) => call.table === 'user_profiles')?.gt).toBe(
			'cursor-from-before'
		);
	});

	it('stops once a batch is not full', async () => {
		results.set('user_profiles', { data: accounts(3), error: null });
		expect((await sendWeeklySuggestions(true)).nextCursor).toBeNull();
	});

	it('suggests nothing to an account whose past suggestions cannot be read', async () => {
		results.set('user_profiles', { data: accounts(1), error: null });
		results.set('notifications', [
			{ data: [], error: null },
			{ data: null, error: { message: 'payment required' } },
		]);

		expect((await sendWeeklySuggestions(true)).suggested).toBe(0);
	});

	it('fails instead of notifying nobody when an account read fails', async () => {
		results.set('user_profiles', {
			data: null,
			error: { message: 'payment required' },
		});
		await expect(sendWeeklySuggestions(true)).rejects.toThrow(
			'payment required'
		);
	});
});
