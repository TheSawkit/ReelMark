import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { getTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return {
		title: t.auth.resetPassword.metaTitle,
		description: t.auth.resetPassword.metaDescription,
		robots: {
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		},
	};
}

export default function ResetPasswordPage() {
	return (
		<AuthPageShell>
			<ResetPasswordForm />
		</AuthPageShell>
	);
}
