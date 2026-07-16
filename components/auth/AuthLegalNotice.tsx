'use client';

import Link from 'next/link';
import { FieldDescription } from '@/components/ui/field';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';

/** Consent notice shown under the auth forms — the link that carries the legal weight, so it stays identical everywhere. */
export function AuthLegalNotice() {
	const { t, lang } = useTranslation();

	return (
		<FieldDescription className="px-6 text-center">
			{t.auth.terms}{' '}
			<Link
				href={localizedHref(lang, '/terms')}
				className="underline hover:text-text transition-colors"
			>
				{t.auth.termsLink}
			</Link>{' '}
			{t.common.and}{' '}
			<Link
				href={localizedHref(lang, '/privacy')}
				className="underline hover:text-text transition-colors"
			>
				{t.auth.privacyLink}
			</Link>
			.
		</FieldDescription>
	);
}
