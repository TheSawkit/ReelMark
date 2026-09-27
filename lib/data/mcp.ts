import 'server-only';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server';
import { hashMcpKey, isMcpKeyFormat } from '@/lib/mcp/keys';
import { reportSwallowed } from '@/lib/report';
import { DEFAULT_LANGUAGE, isLanguage } from '@/lib/i18n/config';
import type { Language } from '@/lib/i18n/translations';
import type { McpLinkStatus } from '@/types/mcp';

/** The signed-in user's AI link, without its secret — only whether it exists and when it was used. */
export async function getMcpLinkStatus(): Promise<McpLinkStatus | null> {
	const { supabase, userId } = await getAuthenticatedUser();
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
		? { createdAt: data.created_at, lastUsedAt: data.last_used_at }
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

export interface McpUserContext {
	userId: string;
	lang: Language;
	region?: string;
}

/** Language and region an assistant request answers in — read from the account, since the request carries no cookie. */
export async function getMcpUserContext(
	userId: string
): Promise<McpUserContext> {
	const { data, error } =
		await createAdminClient().auth.admin.getUserById(userId);
	if (error) reportSwallowed('mcp:user-context', error);
	const metadata = data.user?.user_metadata ?? {};
	return {
		userId,
		lang: isLanguage(metadata.language)
			? metadata.language
			: DEFAULT_LANGUAGE,
		region:
			typeof metadata.region === 'string' && metadata.region
				? metadata.region.toUpperCase()
				: undefined,
	};
}
