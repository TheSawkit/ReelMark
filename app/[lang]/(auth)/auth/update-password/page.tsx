import type { Metadata } from 'next';
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm';
import { getTranslations } from '@/lib/i18n/server';

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
		<div className="flex w-full max-w-sm flex-col gap-6">
			<UpdatePasswordForm />
			<p className="text-center text-sm text-muted">
				{t.auth.updatePassword.footerHint}
			</p>
		</div>
	);
}
