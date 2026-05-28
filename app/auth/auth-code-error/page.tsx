import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { getTranslations } from '@/lib/i18n/server';

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
	const t = await getTranslations();

	return (
		<div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
			<h1 className="mb-4 font-display text-4xl font-normal text-text md:text-5xl">
				{t.auth.errors.authentication}
			</h1>
			<p className="mb-8 max-w-md text-lg text-muted">
				{t.auth.errors.description}
			</p>
			<div className="flex gap-4">
				<Button asChild>
					<Link href="/login">{t.auth.errors.retry}</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href="/">{t.auth.errors.backHome}</Link>
				</Button>
			</div>
		</div>
	);
}
