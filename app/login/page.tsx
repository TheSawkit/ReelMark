import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import { BASE_URL } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t.metadata.loginTitle,
    description: t.metadata.loginDescription,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
    alternates: { canonical: `${BASE_URL}/login` },
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
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm />
      </div>
    </main>
  );
}
