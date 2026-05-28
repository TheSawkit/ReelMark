import { cookies, headers } from 'next/headers';
import { translations, type Language } from './translations';
import { getLocale } from './utils';

export { getLocale };

/** Resolves the user's preferred language server-side (cookie → Accept-Language → "en"). */
export async function getServerLanguage(): Promise<Language> {
	const cookieStore = await cookies();
	const savedLang = cookieStore.get('preferred-language')?.value;

	if (savedLang === 'fr' || savedLang === 'en') {
		return savedLang;
	}

	const headersList = await headers();
	const acceptLanguage = headersList.get('accept-language') ?? '';
	const primaryLang = acceptLanguage
		.split(',')[0]
		?.split('-')[0]
		?.toLowerCase();

	if (primaryLang === 'fr') return 'fr';

	return 'en';
}

/** Returns the translation object for the server-resolved language. */
export async function getTranslations() {
	const lang = await getServerLanguage();
	return translations[lang];
}

/** Returns the BCP 47 locale string ("fr-FR" or "en-US") for the server-resolved language. */
export async function getServerLocale(): Promise<string> {
	const lang = await getServerLanguage();
	return lang === 'fr' ? 'fr-FR' : 'en-US';
}
