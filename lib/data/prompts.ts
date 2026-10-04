import 'server-only';

import { cache } from 'react';
import { getUserContext } from '@/lib/supabase/auth-helpers';
import { reportSwallowed } from '@/lib/report';
import {
	isPromptKey,
	isPromptState,
	type PromptStates,
} from '@/lib/prompts/keys';
import type { Database } from '@/types/database';

type ShellStateRow =
	Database['public']['Functions']['my_shell_state']['Returns'][number];

/** What the navbar and the call-to-action slot need from the database on every page. */
export interface ShellState {
	unreadCount: number;
	avatarUrl: string | null;
	/** `user_profiles.created_at` — the profile is created at signup, or at onboarding for OAuth accounts. */
	accountCreatedAt: number | null;
	watchlistCount: number;
	hasStreamingProviders: boolean;
	promptStates: PromptStates;
}

export const EMPTY_SHELL_STATE: ShellState = {
	unreadCount: 0,
	avatarUrl: null,
	accountCreatedAt: null,
	watchlistCount: 0,
	hasStreamingProviders: false,
	promptStates: {},
};

/** Maps the `my_shell_state` row, dropping any prompt answer the app no longer knows. */
export function toShellState(
	row: ShellStateRow | null | undefined
): ShellState {
	if (!row) return EMPTY_SHELL_STATE;

	const promptStates: PromptStates = {};
	const prompts =
		row.prompts &&
		typeof row.prompts === 'object' &&
		!Array.isArray(row.prompts)
			? row.prompts
			: {};
	for (const [key, state] of Object.entries(prompts)) {
		if (
			typeof state === 'string' &&
			isPromptKey(key) &&
			isPromptState(state)
		)
			promptStates[key] = state;
	}

	const createdAt = row.profile_created_at
		? Date.parse(row.profile_created_at)
		: NaN;

	return {
		unreadCount: Number(row.unread_notifications) || 0,
		avatarUrl: row.avatar_url ?? null,
		accountCreatedAt: Number.isFinite(createdAt) ? createdAt : null,
		watchlistCount: Number(row.watchlist_count) || 0,
		hasStreamingProviders: row.has_streaming_providers === true,
		promptStates,
	};
}

/**
 * Unread count, avatar, account age, library size, streaming setup and prompt answers in one
 * request-deduped round-trip. The shell renders on every page, and these used to be five
 * separate queries — one of them a count over the whole watchlist.
 */
export const getShellState = cache(async (): Promise<ShellState> => {
	const { supabase, user } = await getUserContext();
	if (!user) return EMPTY_SHELL_STATE;

	const { data, error } = await supabase.rpc('my_shell_state');
	if (error) {
		reportSwallowed('shell:state', error);
		return EMPTY_SHELL_STATE;
	}

	return toShellState(data?.[0]);
});
