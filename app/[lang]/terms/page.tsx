import type { Metadata } from 'next';
import { LegalArticle } from '@/components/legal/LegalArticle';
import { getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return buildPageMetadata(
		t.pages.legal.terms.title,
		t.pages.legal.terms.intro
	);
}

export default async function TermsPage() {
	const t = await getTranslations();
	return <LegalArticle content={t.pages.legal.terms} />;
}
