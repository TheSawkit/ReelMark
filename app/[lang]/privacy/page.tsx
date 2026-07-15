import type { Metadata } from 'next';
import { LegalArticle } from '@/components/legal/LegalArticle';
import { getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

interface PrivacyPageProps {
	params: Promise<{ lang: Language }>;
}

export async function generateMetadata({
	params,
}: PrivacyPageProps): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return buildPageMetadata(
		t.pages.legal.privacy.title,
		t.pages.legal.privacy.intro
	);
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return <LegalArticle content={t.pages.legal.privacy} />;
}
