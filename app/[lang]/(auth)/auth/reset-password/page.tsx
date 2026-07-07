import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { getTranslations } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
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

export default async function ResetPasswordPage() {
	return (
		<AuthPageShell>
			<ResetPasswordForm />
		</AuthPageShell>
	);
}
