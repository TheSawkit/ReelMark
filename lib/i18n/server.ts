import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { translations, type Language } from './translations';
import { getLocale } from './utils';
import { DEFAULT_LANGUAGE, isLanguage } from './config';

/**
 * Resolves the request's preferred language (cookie → Accept-Language → default).
 * Fallback for Server Actions and route handlers; localized pages should pass the
 * route `lang` param to `getTranslations`/`getServerLocale` instead (keeps them static).
 */
export const getServerLanguage = cache(async (): Promise<Language> => {
	const headersList = await headers();
	const headerLang = headersList.get('x-locale');
	if (isLanguage(headerLang)) return headerLang;

	const cookieStore = await cookies();
	const savedLang = cookieStore.get('preferred-language')?.value;
	if (isLanguage(savedLang)) return savedLang;

	const acceptLanguage = headersList.get('accept-language') ?? '';
	const primaryLang = acceptLanguage
		.split(',')[0]
		?.split('-')[0]
		?.toLowerCase();

	if (primaryLang === 'fr') return 'fr';

	return DEFAULT_LANGUAGE;
});

/** Returns the translation object for the given language, or the request-resolved one when omitted. */
export const getTranslations = cache(async (lang?: Language) => {
	const resolved = lang ?? (await getServerLanguage());
	return translations[resolved];
});

export type Translations = Awaited<ReturnType<typeof getTranslations>>;

/** Returns the BCP 47 locale string for the given language, or the request-resolved one when omitted. */
export const getServerLocale = cache(
	async (lang?: Language): Promise<string> => {
		const resolved = lang ?? (await getServerLanguage());
		return getLocale(resolved);
	}
);
