import 'server-only';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server';
import { hashMcpKey, isMcpKeyFormat } from '@/lib/mcp/keys';
import { cachedUserContext } from '@/lib/mcp/user-cache';
import { reportSwallowed } from '@/lib/report';
import { DEFAULT_LANGUAGE, isLanguage } from '@/lib/i18n/config';
import type { McpLinkStatus, McpUserContext } from '@/types/mcp';

/** The signed-in user's AI link, without its secret — whether it exists, when it was used, and what it allows. */
export async function getMcpLinkStatus(): Promise<McpLinkStatus | null> {
	const { supabase, userId, user } = await getAuthenticatedUser();
	const { data, error } = await supabase
		.from('mcp_keys')
		.select('created_at, last_used_at')
		.eq('user_id', userId)
		.maybeSingle();
	if (error) {
		reportSwallowed('mcp:link-status', error);
		return null;
	}
	return data
		? {
				createdAt: data.created_at,
				lastUsedAt: data.last_used_at,
				access:
					user.user_metadata.mcp_access === 'write'
						? 'write'
						: 'read',
			}
		: null;
}

const TOUCH_INTERVAL_MS = 3_600_000;

export interface McpLinkOwner {
	userId: string;
	lastUsedAt: string | null;
}

/** Resolves a link secret to its owner, or null for an unknown or revoked link. */
export async function resolveMcpKey(key: string): Promise<McpLinkOwner | null> {
	if (!isMcpKeyFormat(key)) return null;
	const { data } = await createAdminClient()
		.from('mcp_keys')
		.select('user_id, last_used_at')
		.eq('key_hash', hashMcpKey(key))
		.maybeSingle();
	return data
		? { userId: data.user_id, lastUsedAt: data.last_used_at }
		: null;
}

/** Stamps the link's last use, at most hourly — Settings shows it by day, and a write per tool call would be pure database churn. */
export async function touchMcpKey({
	userId,
	lastUsedAt,
}: McpLinkOwner): Promise<void> {
	const now = Date.now();
	if (lastUsedAt && now - Date.parse(lastUsedAt) < TOUCH_INTERVAL_MS) return;
	const { error } = await createAdminClient()
		.from('mcp_keys')
		.update({ last_used_at: new Date(now).toISOString() })
		.eq('user_id', userId);
	if (error) reportSwallowed('mcp:touch', error);
}

/**
 * Language and region an assistant request answers in — read from the account, since the request
 * carries no cookie. Cached per user, and only the tools that format an answer ask for it.
 *
 * @throws The Auth error, so a failed read is never cached in place of the real settings.
 */
export function getMcpUserContext(userId: string): Promise<McpUserContext> {
	return cachedUserContext.get(userId, async () => {
		const { data, error } =
			await createAdminClient().auth.admin.getUserById(userId);
		if (error) throw error;
		const metadata = data.user.user_metadata;
		return {
			lang: isLanguage(metadata.language)
				? metadata.language
				: DEFAULT_LANGUAGE,
			region:
				typeof metadata.region === 'string' && metadata.region
					? metadata.region.toUpperCase()
					: undefined,
		};
	});
}
