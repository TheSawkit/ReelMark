import { cache } from 'react';
import { getPromptStates } from '@/app/actions/prompts';
import { getUserContext } from '@/lib/supabase/auth-helpers';

export const getCachedPromptStates = cache(getPromptStates);

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
