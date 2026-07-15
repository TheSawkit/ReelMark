import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import type { Language } from '@/lib/i18n/translations';

interface AuthErrorPageProps {
	params: Promise<{ lang: Language }>;
}

export async function generateMetadata({
	params,
}: AuthErrorPageProps): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return {
		title: t.metadata.authErrorTitle,
		description: t.metadata.authErrorDescription,
		robots: {
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		},
	};
}

export default async function AuthErrorPage({ params }: AuthErrorPageProps) {
	const { lang } = await params;
	const t = await getTranslations(lang);

	return (
		<div className="flex flex-col items-center text-center">
			<h1 className="mb-4 font-display text-4xl font-normal text-text md:text-5xl">
				{t.auth.errors.authentication}
			</h1>
			<p className="mb-8 max-w-md text-lg text-muted">
				{t.auth.errors.description}
			</p>
			<div className="flex gap-4">
				<Button asChild>
					<Link href={localizedHref(lang, '/login')}>
						{t.auth.errors.retry}
					</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href={localizedHref(lang, '/')}>
						{t.auth.errors.backHome}
					</Link>
				</Button>
			</div>
		</div>
	);
}
