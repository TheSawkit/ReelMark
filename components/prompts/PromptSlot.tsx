import { getUserContext } from '@/lib/supabase/auth-helpers';
import {
	getCachedPromptStates,
	getCachedWatchlistCount,
} from '@/lib/data/prompts';
import { PromptHost } from '@/components/prompts/PromptHost';

/** Below this many watchlist entries, importing an existing library is worth offering. */
const IMPORT_THRESHOLD = 3;

/** Feeds the call-to-action slot with what only the server knows; anonymous visitors still get the install banner. */
export async function PromptSlot() {
	const { user } = await getUserContext();

	if (!user)
		return (
			<PromptHost
				initialStates={{}}
				accountCreatedAt={null}
				canImport={false}
			/>
		);

	const [states, watchlistCount] = await Promise.all([
		getCachedPromptStates(),
		getCachedWatchlistCount(),
	]);

	const createdAt = Date.parse(user.created_at);

	return (
		<PromptHost
			initialStates={states}
			accountCreatedAt={Number.isFinite(createdAt) ? createdAt : null}
			canImport={watchlistCount < IMPORT_THRESHOLD}
		/>
	);
}
