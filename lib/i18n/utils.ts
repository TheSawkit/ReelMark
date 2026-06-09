import type { Language } from './translations';
import { isLanguage } from './config';

/**
 * Converts an app language code to a BCP 47 locale string.
 *
 * @param lang - App language code ("fr" or "en").
 * @returns BCP 47 locale string ("fr-FR" or "en-US").
 */
export function getLocale(lang: Language): string {
	return lang === 'fr' ? 'fr-FR' : 'en-US';
}

/**
 * Prefixes an internal path with the locale segment; already-localized and external paths pass through.
 *
 * @param lang - Target language segment.
 * @param path - Internal path starting with "/", or an external/anchor href.
 * @returns Locale-prefixed path (e.g. "/en/dashboard").
 */
export function localizedHref(lang: Language, path: string): string {
	if (!path.startsWith('/')) return path;
	if (isLanguage(path.split('/')[1])) return path;
	return path === '/' ? `/${lang}` : `/${lang}${path}`;
}

/**
 * Removes a leading locale segment from a path, returning the locale-agnostic remainder.
 *
 * @param path - Path that may start with "/en" or "/fr".
 * @returns Path without the locale segment (e.g. "/dashboard"), or "/" when only the locale remained.
 */
export function stripLocale(path: string): string {
	const segment = path.split('/')[1];
	if (!isLanguage(segment)) return path;
	const rest = path.slice(segment.length + 1);
	return rest === '' ? '/' : rest;
}
