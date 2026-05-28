import type { Language } from './translations';

/**
 * Converts an app language code to a BCP 47 locale string.
 *
 * @param lang - App language code ("fr" or "en").
 * @returns BCP 47 locale string ("fr-FR" or "en-US").
 */
export function getLocale(lang: Language): string {
    return lang === 'fr' ? 'fr-FR' : 'en-US';
}
