import { getCachedStreamingProviders } from '@/lib/data/watchlist';
import {
	getCachedPromptStates,
	getCachedWatchlistCount,
} from '@/lib/data/prompts';
import { getUserContext } from '@/lib/supabase/auth-helpers';
import { StreamingPromptCard } from '@/components/dashboard/StreamingPromptCard';

/** Enough of a library for "what's on my platforms" to return anything useful. */
const MIN_WATCHLIST_ENTRIES = 5;

export async function StreamingPromptSection() {
	const { user } = await getUserContext();
	if (!user) return null;

	const [providerIds, states, watchlistCount] = await Promise.all([
		getCachedStreamingProviders(),
		getCachedPromptStates(),
		getCachedWatchlistCount(),
	]);

	if (providerIds.length > 0) return null;
	if (states.streaming !== undefined) return null;
	if (watchlistCount < MIN_WATCHLIST_ENTRIES) return null;

	return <StreamingPromptCard />;
}
