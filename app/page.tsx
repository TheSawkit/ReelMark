import type { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import CTASection from '@/components/home/CTASection';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: { absolute: t.metadata.landingTitle },
    description: t.metadata.landingDescription,
    openGraph: {
      title: t.metadata.landingTitle,
      description: t.metadata.landingDescription,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.metadata.landingTitle,
      description: t.metadata.landingDescription,
    },
  };
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </main>
  );
}
