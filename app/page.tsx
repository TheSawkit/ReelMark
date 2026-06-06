import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import HeroSection from '@/components/home/HeroSection';
import PreviewSection from '@/components/home/PreviewSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import CTASection from '@/components/home/CTASection';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/i18n/server';
import {
	getTrendingMovies,
	getTrendingTvShows,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import type { Movie, TvShow } from '@/types/tmdb';

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

	const [movies, shows] = await Promise.all([
		getTrendingMovies().catch((): Movie[] => []),
		getTrendingTvShows().catch((): TvShow[] => []),
	]);
	const movieItems = movies.map(movieToMediaItem);
	const showItems = shows.map(tvShowToMediaItem);

	return (
		<main className="min-h-screen">
			<HeroSection posters={[...movieItems, ...showItems]} />
			<PreviewSection movies={movieItems} shows={showItems} />
			<FeaturesSection />
			<CTASection />
		</main>
	);
}
