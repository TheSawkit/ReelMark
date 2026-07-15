import type { Metadata } from 'next';
import { LegalArticle } from '@/components/legal/LegalArticle';
import { getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

interface TermsPageProps {
	params: Promise<{ lang: Language }>;
}

export async function generateMetadata({
	params,
}: TermsPageProps): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return buildPageMetadata(
		t.pages.legal.terms.title,
		t.pages.legal.terms.intro
	);
}

export default async function TermsPage({ params }: TermsPageProps) {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return <LegalArticle content={t.pages.legal.terms} />;
}
