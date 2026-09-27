import { localizedHref } from '@/lib/i18n/utils';
import { sanitizeRedirectPath } from '@/lib/validators';
import type { Language } from '@/lib/i18n/translations';

/** Login page of a language, with `next` when there is a same-site page to come back to. */
export function loginHref(lang: Language, next?: string | null): string {
	const back = sanitizeRedirectPath(next ?? null, '');
	const login = localizedHref(lang, '/login');
	return back ? `${login}?next=${encodeURIComponent(back)}` : login;
}
