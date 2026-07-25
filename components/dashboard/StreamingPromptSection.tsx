import { getMyStreamingProviders } from '@/app/actions/recommendations';
import { getPromptStates } from '@/app/actions/prompts';
import { getUserContext } from '@/lib/supabase/auth-helpers';
import { StreamingPromptCard } from '@/components/dashboard/StreamingPromptCard';

/** Enough of a library for "what's on my platforms" to return anything useful. */
const MIN_WATCHLIST_ENTRIES = 5;

export async function StreamingPromptSection() {
	const { supabase, user } = await getUserContext();
	if (!user) return null;

	const [providerIds, states, watchlist] = await Promise.all([
		getMyStreamingProviders(),
		getPromptStates(),
		supabase
			.from('watchlist')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id),
	]);

	if (providerIds.length > 0) return null;
	if (states.streaming !== undefined) return null;
	if ((watchlist.count ?? 0) < MIN_WATCHLIST_ENTRIES) return null;

	return <StreamingPromptCard />;
}
