import { describe, it, expect } from 'vitest';
import {
	pickPrompt,
	PROMPT_COOLDOWN_MS,
	ACCOUNT_GRACE_MS,
	type PromptContext,
} from '@/lib/prompts/engine';

const NOW = 1_800_000_000_000;

const context = (overrides: Partial<PromptContext> = {}): PromptContext => ({
	eligible: ['push'],
	states: {},
	lastShownAt: null,
	accountCreatedAt: null,
	shownThisSession: false,
	now: NOW,
	...overrides,
});

describe('pickPrompt', () => {
	it('returns the only eligible prompt on a clean slate', () => {
		expect(pickPrompt(context())).toBe('push');
	});

	it('returns null when nothing is eligible', () => {
		expect(pickPrompt(context({ eligible: [] }))).toBeNull();
	});

	it('shows install before push, since iOS push needs the installed app', () => {
		expect(pickPrompt(context({ eligible: ['push', 'install'] }))).toBe(
			'install'
		);
	});

	it('shows push before import', () => {
		expect(pickPrompt(context({ eligible: ['import', 'push'] }))).toBe(
			'push'
		);
	});

	it('never asks twice, whatever the previous answer was', () => {
		expect(
			pickPrompt(context({ states: { push: 'dismissed' } }))
		).toBeNull();
		expect(pickPrompt(context({ states: { push: 'done' } }))).toBeNull();
	});

	it('falls through to the next prompt when the top one is already answered', () => {
		const picked = pickPrompt(
			context({
				eligible: ['install', 'push'],
				states: { install: 'dismissed' },
			})
		);
		expect(picked).toBe('push');
	});

	it('shows at most one banner per session', () => {
		expect(pickPrompt(context({ shownThisSession: true }))).toBeNull();
	});

	it('stays quiet during the cooldown that follows another banner', () => {
		const justBefore = NOW - PROMPT_COOLDOWN_MS + 1;
		expect(pickPrompt(context({ lastShownAt: justBefore }))).toBeNull();
	});

	it('speaks again once the cooldown has elapsed', () => {
		const elapsed = NOW - PROMPT_COOLDOWN_MS;
		expect(pickPrompt(context({ lastShownAt: elapsed }))).toBe('push');
	});

	it('leaves a freshly created account alone', () => {
		const justSignedUp = NOW - ACCOUNT_GRACE_MS + 1;
		expect(
			pickPrompt(context({ accountCreatedAt: justSignedUp }))
		).toBeNull();
	});

	it('ignores an eligible key that has no banner slot', () => {
		expect(pickPrompt(context({ eligible: ['streaming'] }))).toBeNull();
	});
});
