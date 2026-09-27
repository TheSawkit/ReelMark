export const SETTINGS_TABS = [
	'profile',
	'security',
	'notifications',
	'appearance',
	'services',
	'data',
	'privacy',
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

/** Anchor of the AI assistant card, and the deep link that opens its tab and scrolls to it. */
export const AI_ASSISTANT_ANCHOR = 'ai-assistant';
export const AI_ASSISTANT_SETTINGS_PATH = `/settings?section=data#${AI_ASSISTANT_ANCHOR}`;

/** Narrows the `?section=` query param — the active tab, and what the call-to-actions deep-link to. */
export function isSettingsTab(value: string | undefined): value is SettingsTab {
	return (
		value !== undefined &&
		(SETTINGS_TABS as readonly string[]).includes(value)
	);
}
