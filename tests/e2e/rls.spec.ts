import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Tables no visitor may read: owner-only data. A table left without Row-Level Security answers
 * the anonymous key with its rows; with RLS on it answers zero rows or a permission error.
 * Read-only on purpose — the probe never writes to the project it runs against.
 */
const PRIVATE_TABLES = [
	'mcp_keys',
	'recommendation_dismissals',
	'user_prompts',
	'user_streaming_providers',
	'notification_preferences',
	'notifications',
	'push_subscriptions',
	'episode_watches',
	'friendships',
] as const;

/** Postgres refusing the table outright: as private as zero rows. Any other error means nothing was verified. */
const INSUFFICIENT_PRIVILEGE = '42501';

test.describe('Row-Level Security', () => {
	test('the anonymous key reads no private row', async () => {
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		test.skip(!url || !anonKey, 'Supabase URL and anon key are not set');

		const anon = createClient(url!, anonKey!, {
			auth: { persistSession: false },
		});
		for (const table of PRIVATE_TABLES) {
			const { count, error } = await anon
				.from(table)
				.select('*', { count: 'exact', head: true });
			const denied = error?.code === INSUFFICIENT_PRIVILEGE;
			expect(
				denied || (error === null && count === 0),
				`${table}: ${error ? error.message : `${count} rows readable anonymously`}`
			).toBe(true);
		}
	});
});
