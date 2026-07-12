import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import HeroSection from '@/components/home/HeroSection';
import PreviewSection from '@/components/home/PreviewSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import CTASection from '@/components/home/CTASection';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import type { Language } from '@/lib/i18n/translations';
import {
	getTrendingMovies,
	getTrendingTvShows,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import type { Movie, TvShow } from '@/types/tmdb';

export const dynamic = 'force-dynamic';

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

export default async function Home({
	params,
}: {
	params: Promise<{ lang: Language }>;
}) {
	const { lang } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		redirect(localizedHref(lang, '/dashboard'));
	}

	const [movies, shows] = await Promise.all([
		getTrendingMovies().catch((): Movie[] => []),
		getTrendingTvShows().catch((): TvShow[] => []),
	]);
	const movieItems = movies.map(movieToMediaItem);
	const showItems = shows.map(tvShowToMediaItem);

	return (
		<div className="min-h-screen">
			<HeroSection posters={[...movieItems, ...showItems]} lang={lang} />
			<PreviewSection movies={movieItems} shows={showItems} />
			<FeaturesSection />
			<CTASection lang={lang} />
		</div>
	);
}
