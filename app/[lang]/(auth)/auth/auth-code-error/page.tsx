import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { getTranslations, getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
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

export default async function AuthErrorPage() {
	const [t, lang] = await Promise.all([
		getTranslations(),
		getServerLanguage(),
	]);

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
