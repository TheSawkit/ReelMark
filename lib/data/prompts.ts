import 'server-only';

import { cache } from 'react';
import { getUserContext } from '@/lib/supabase/auth-helpers';
import {
	isPromptKey,
	isPromptState,
	type PromptStates,
} from '@/lib/prompts/keys';

/** Answers already given to account-scoped call-to-actions, so none is ever asked twice. */
export const getCachedPromptStates = cache(async (): Promise<PromptStates> => {
	const { supabase, user } = await getUserContext();
	if (!user) return {};

	const { data } = await supabase
		.from('user_prompts')
		.select('prompt_key, state')
		.eq('user_id', user.id);

	const states: PromptStates = {};
	for (const row of data ?? []) {
		if (isPromptKey(row.prompt_key) && isPromptState(row.state))
			states[row.prompt_key] = row.state;
	}
	return states;
});

/**
 * Watchlist size only, request-deduped: the call-to-action slot renders on every page,
 * so it must never pull the whole list just to know whether the library is still empty.
 */
export const getCachedWatchlistCount = cache(async (): Promise<number> => {
	const { supabase, user } = await getUserContext();
	if (!user) return 0;

	const { count } = await supabase
		.from('watchlist')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', user.id);

	return count ?? 0;
});
