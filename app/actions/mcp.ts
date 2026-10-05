'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { withinUserRateLimit } from '@/lib/rate-limiter';
import { RATE_LIMITED, type Refusal } from '@/lib/action-errors';
import { generateMcpKey } from '@/lib/mcp/keys';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';
import { reportSwallowed } from '@/lib/report';
import type { McpAccess } from '@/types/mcp';

const LINK_LIMIT = 10;
const LINK_WINDOW_MS = 3_600_000;

/**
 * Creates the user's AI link, replacing any previous one so an old link dies the moment a new one
 * exists. Its access is bound to the secret itself; the account only remembers it for display.
 *
 * @param access - 'write' lets the assistant change title statuses; anything else is read-only.
 * @returns The link secret — returned once, only its hash is stored — or a refusal once the hourly
 * budget is exhausted.
 */
export async function createMcpLink(
	access: McpAccess
): Promise<string | Refusal<typeof RATE_LIMITED>> {
	const { supabase, userId } = await getAuthenticatedUser();
	if (!withinUserRateLimit('mcp-link', userId, LINK_LIMIT, LINK_WINDOW_MS))
		return { refused: RATE_LIMITED };

	const granted: McpAccess = access === 'write' ? 'write' : 'read';
	const { key, hash } = generateMcpKey(granted);
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

	const { error: metadataError } = await supabase.auth.updateUser({
		data: { mcp_access: granted },
	});
	if (metadataError) reportSwallowed('mcp:link-access', metadataError);
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
