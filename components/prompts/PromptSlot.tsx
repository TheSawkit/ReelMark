import { getUserContext } from '@/lib/supabase/auth-helpers';
import { getShellState } from '@/lib/data/prompts';
import { PromptHost } from '@/components/prompts/PromptHost';

/** Below this many watchlist entries, importing an existing library is worth offering. */
const IMPORT_THRESHOLD = 3;

/** Enough of a library for "what's on my platforms" to return anything useful. */
const SERVICES_THRESHOLD = 5;

/** Feeds the call-to-action slot with what only the server knows; anonymous visitors still get the install banner. */
export async function PromptSlot() {
	const { user } = await getUserContext();

	if (!user)
		return (
			<PromptHost
				initialStates={{}}
				accountCreatedAt={null}
				canImport={false}
				canPickServices={false}
				signedIn={false}
			/>
		);

	const shell = await getShellState();

	return (
		<PromptHost
			initialStates={shell.promptStates}
			accountCreatedAt={shell.accountCreatedAt}
			canImport={shell.watchlistCount < IMPORT_THRESHOLD}
			canPickServices={
				!shell.hasStreamingProviders &&
				shell.watchlistCount >= SERVICES_THRESHOLD
			}
			signedIn
		/>
	);
}
