import type { Metadata } from 'next';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm';
import { getTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';

interface UpdatePasswordPageProps {
	params: Promise<{ lang: Language }>;
}

export async function generateMetadata({
	params,
}: UpdatePasswordPageProps): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
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

export default async function UpdatePasswordPage({
	params,
}: UpdatePasswordPageProps) {
	const { lang } = await params;
	const t = await getTranslations(lang);

	return (
		<AuthPageShell>
			<UpdatePasswordForm />
			<p className="text-center text-sm text-muted">
				{t.auth.updatePassword.footerHint}
			</p>
		</AuthPageShell>
	);
}
