import type { Language } from './translations';

export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
export const DEFAULT_LANGUAGE: Language = 'en';

/** Type guard narrowing an unknown value to a supported `Language`. */
export function isLanguage(value: unknown): value is Language {
	return value === 'en' || value === 'fr';
}
