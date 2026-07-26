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

/**
 * Narrows the `?section=` query param used by the call-to-actions that deep-link here.
 * Hors de SettingsNav, qui est un composant client : la page Réglages est un Server
 * Component et ne peut pas appeler une fonction exportée depuis la frontière client.
 */
export function isSettingsTab(value: string | undefined): value is SettingsTab {
	return (
		value !== undefined &&
		(SETTINGS_TABS as readonly string[]).includes(value)
	);
}
