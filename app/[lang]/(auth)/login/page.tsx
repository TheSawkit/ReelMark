import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/supabase/auth-helpers';
import { getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { sanitizeRedirectPath } from '@/lib/validators';
import { localizedAlternates } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

type Props = {
	params: Promise<{ lang: Language }>;
	searchParams: Promise<{ next?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);

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

export default async function LoginPage({ params, searchParams }: Props) {
	const [{ lang }, { next }] = await Promise.all([params, searchParams]);
	const returnTo = sanitizeRedirectPath(next ?? null, '/dashboard');
	const { user } = await getUserContext();

	if (user) {
		redirect(localizedHref(lang, returnTo));
	}

	return (
		<AuthPageShell>
			<LoginForm next={returnTo} />
		</AuthPageShell>
	);
}
