import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm';
import { getTranslations } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return {
		title: t.auth.updatePassword.metaTitle,
		description: t.auth.updatePassword.metaDescription,
		robots: {
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		},
	};
}

export default async function UpdatePasswordPage() {
	const t = await getTranslations();

	return (
		<AuthPageShell>
			<UpdatePasswordForm />
			<p className="text-center text-sm text-muted">
				{t.auth.updatePassword.footerHint}
			</p>
		</AuthPageShell>
	);
}
