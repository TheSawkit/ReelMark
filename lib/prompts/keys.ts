export const PROMPT_KEYS = ['install', 'push', 'import', 'streaming'] as const;

export type PromptKey = (typeof PROMPT_KEYS)[number];

export type PromptState = 'done' | 'dismissed';

export type PromptStates = Partial<Record<PromptKey, PromptState>>;

/** Answered per account, so a refusal on desktop also holds on mobile. */
export const ACCOUNT_PROMPTS = new Set<PromptKey>(['import', 'streaming']);

/** Answered per browser: neither a notification permission nor an install leaves its device. */
export const DEVICE_PROMPTS = new Set<PromptKey>(['install', 'push']);

/** Order the banner slot resolves ties in: install first, since iOS push requires the PWA. */
export const BANNER_PRIORITY = ['install', 'push', 'import'] as const;

export function isPromptKey(value: string): value is PromptKey {
	return (PROMPT_KEYS as readonly string[]).includes(value);
}

export function isPromptState(value: string): value is PromptState {
	return value === 'done' || value === 'dismissed';
}
