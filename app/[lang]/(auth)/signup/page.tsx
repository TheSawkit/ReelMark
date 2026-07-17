import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { SignupForm } from '@/components/auth/SignupForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { localizedAlternates } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ lang: Language }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);

	return {
		title: t.metadata.signupTitle,
		description: t.metadata.signupDescription,
		robots: {
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		},
		alternates: localizedAlternates(lang, '/signup'),
		openGraph: {
			title: t.metadata.signupTitle,
			description: t.metadata.signupDescription,
			type: 'website',
		},
		twitter: {
			card: 'summary',
			title: t.metadata.signupTitle,
			description: t.metadata.signupDescription,
		},
	};
}

export default async function SignupPage({ params }: Props) {
	const { lang } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		redirect(localizedHref(lang, '/dashboard'));
	}

	return (
		<AuthPageShell>
			<SignupForm />
		</AuthPageShell>
	);
}
