'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import {
	ACCOUNT_PROMPTS,
	isPromptState,
	type PromptKey,
	type PromptState,
} from '@/lib/prompts/keys';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

/** Records the user's answer to a call-to-action; deliberately never revalidates. */
export async function resolvePrompt(
	key: PromptKey,
	state: PromptState
): Promise<void> {
	if (!ACCOUNT_PROMPTS.has(key)) throw new Error('Invalid prompt_key');
	if (!isPromptState(state)) throw new Error('Invalid state');

	const { supabase, userId } = await getAuthenticatedUser();

	const { error } = await supabase.from('user_prompts').upsert(
		{
			user_id: userId,
			prompt_key: key,
			state,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: ON_CONFLICT.userPrompts }
	);
	if (error) throw new Error(error.message);
}
