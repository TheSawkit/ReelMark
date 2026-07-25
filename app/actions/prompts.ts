'use server';

import { getAuthenticatedUser, getOptionalUser } from '@/lib/supabase/auth-helpers';
import {
	ACCOUNT_PROMPTS,
	PROMPT_KEYS,
	type PromptKey,
	type PromptState,
	type PromptStates,
} from '@/lib/prompts/keys';

const VALID_STATES = new Set<PromptState>(['done', 'dismissed']);

/** Answers already given to account-scoped call-to-actions, so none is ever asked twice. */
export async function getPromptStates(): Promise<PromptStates> {
	const { supabase, userId } = await getOptionalUser();
	if (!userId) return {};

	const { data } = await supabase
		.from('user_prompts')
		.select('prompt_key, state')
		.eq('user_id', userId);

	const states: PromptStates = {};
	for (const row of data ?? []) {
		const key = row.prompt_key as PromptKey;
		if (PROMPT_KEYS.includes(key)) states[key] = row.state as PromptState;
	}
	return states;
}

/** Records the user's answer to a call-to-action; deliberately never revalidates. */
export async function resolvePrompt(
	key: PromptKey,
	state: PromptState
): Promise<void> {
	if (!ACCOUNT_PROMPTS.has(key)) throw new Error('Invalid prompt_key');
	if (!VALID_STATES.has(state)) throw new Error('Invalid state');

	const { supabase, userId } = await getAuthenticatedUser();

	const { error } = await supabase.from('user_prompts').upsert(
		{
			user_id: userId,
			prompt_key: key,
			state,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: 'user_id,prompt_key' }
	);
	if (error) throw new Error(error.message);
}
