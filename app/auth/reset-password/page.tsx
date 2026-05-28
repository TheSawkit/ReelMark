import type { Metadata } from 'next';
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
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <ResetPasswordForm />
            </div>
        </div>
    );
}
