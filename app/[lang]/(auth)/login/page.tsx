import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { localizedAlternates } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
	const [t, lang] = await Promise.all([
		getTranslations(),
		getServerLanguage(),
	]);

	return {
		title: t.metadata.loginTitle,
		description: t.metadata.loginDescription,
		robots: {
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		},
		alternates: localizedAlternates(lang, '/login'),
		openGraph: {
			title: t.metadata.loginTitle,
			description: t.metadata.loginDescription,
			type: 'website',
		},
		twitter: {
			card: 'summary',
			title: t.metadata.loginTitle,
			description: t.metadata.loginDescription,
		},
	};
}

export default async function LoginPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		redirect(localizedHref(await getServerLanguage(), '/dashboard'));
	}

	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<LoginForm />
		</div>
	);
}
