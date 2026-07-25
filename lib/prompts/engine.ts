import { BANNER_PRIORITY, type PromptKey, type PromptStates } from './keys';

/** Minimum quiet period between two different call-to-action banners. */
export const PROMPT_COOLDOWN_MS = 3 * 86_400_000;

/** Quiet period after signup, so a fresh account is never greeted by a banner. */
export const ACCOUNT_GRACE_MS = 10 * 60_000;

export interface PromptContext {
	eligible: readonly PromptKey[];
	states: PromptStates;
	lastShownAt: number | null;
	accountCreatedAt: number | null;
	shownThisSession: boolean;
	now: number;
}

/**
 * The single call-to-action to display, or null when every anti-spam rule says stay quiet:
 * one banner per session, never twice for the same prompt, and a cooldown between two of them.
 */
export function pickPrompt(context: PromptContext): PromptKey | null {
	if (context.shownThisSession) return null;

	if (
		context.accountCreatedAt !== null &&
		context.now - context.accountCreatedAt < ACCOUNT_GRACE_MS
	)
		return null;

	if (
		context.lastShownAt !== null &&
		context.now - context.lastShownAt < PROMPT_COOLDOWN_MS
	)
		return null;

	const offered = new Set(context.eligible);

	return (
		BANNER_PRIORITY.find(
			(key) => offered.has(key) && context.states[key] === undefined
		) ?? null
	);
}
