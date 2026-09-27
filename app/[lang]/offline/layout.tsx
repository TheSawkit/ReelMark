import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return buildPageMetadata(t.offline.title, t.offline.description, {
		isPrivate: true,
	});
}

export default function OfflineLayout({ children }: { children: ReactNode }) {
	return children;
}
