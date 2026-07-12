import type { Metadata } from 'next';
import { LegalArticle } from '@/components/legal/LegalArticle';
import { getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return buildPageMetadata(
		t.pages.legal.privacy.title,
		t.pages.legal.privacy.intro
	);
}

export default async function PrivacyPage() {
	const t = await getTranslations();
	return <LegalArticle content={t.pages.legal.privacy} />;
}
