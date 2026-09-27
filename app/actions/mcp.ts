'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { enforceUserRateLimit } from '@/lib/rate-limiter';
import { generateMcpKey } from '@/lib/mcp/keys';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

const LINK_LIMIT = 10;
const LINK_WINDOW_MS = 3_600_000;

/**
 * Creates the user's AI link, replacing any previous one so an old link dies the moment a new one exists.
 *
 * @returns The link secret — returned once, only its hash is stored.
 * @throws Error('RATE_LIMITED') once the hourly budget is exhausted.
 */
export async function createMcpLink(): Promise<string> {
	const { supabase, userId } = await getAuthenticatedUser();
	enforceUserRateLimit('mcp-link', userId, LINK_LIMIT, LINK_WINDOW_MS);

	const { key, hash } = generateMcpKey();
	const { error } = await supabase.from('mcp_keys').upsert(
		{
			user_id: userId,
			key_hash: hash,
			created_at: new Date().toISOString(),
			last_used_at: null,
		},
		{ onConflict: ON_CONFLICT.mcpKeys }
	);
	if (error) throw new Error(error.message);
	return key;
}

/** Revokes the user's AI link: the assistant loses access on its next call. */
export async function revokeMcpLink(): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();
	const { error } = await supabase
		.from('mcp_keys')
		.delete()
		.eq('user_id', userId);
	if (error) throw new Error(error.message);
}
