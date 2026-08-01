import { DEFAULT_LANGUAGE, isLanguage } from './config';
import type { Language } from './translations';

/**
 * Resolves the visitor's language from the browser alone, for the screens rendered outside the
 * `[lang]` segment — `not-found` and `global-error` have no route param and no i18n provider,
 * and reading cookies server-side there would opt the prerendered shell into dynamic rendering.
 */
export function detectClientLanguage(): Language {
	if (typeof document === 'undefined') return DEFAULT_LANGUAGE;

	const cookie = document.cookie.match(/(?:^|; )preferred-language=([^;]+)/);
	if (isLanguage(cookie?.[1])) return cookie[1];

	if (
		typeof navigator !== 'undefined' &&
		navigator.language.startsWith('fr')
	) {
		return 'fr';
	}

	return DEFAULT_LANGUAGE;
}
