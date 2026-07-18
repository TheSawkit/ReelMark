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
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import {
	webSiteJsonLd,
	organizationJsonLd,
	serializeJsonLd,
} from '@/lib/structured-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return {
		title: { absolute: t.metadata.landingTitle },
		description: t.metadata.landingDescription,
		openGraph: {
			title: t.metadata.landingTitle,
			description: t.metadata.landingDescription,
			type: 'website',
			images: [DEFAULT_OG_IMAGE],
		},
		twitter: {
			card: 'summary_large_image',
			title: t.metadata.landingTitle,
			description: t.metadata.landingDescription,
			images: [DEFAULT_OG_IMAGE.url],
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
		getTrendingMovies('week', 1, lang).catch((): Movie[] => []),
		getTrendingTvShows('week', 1, lang).catch((): TvShow[] => []),
	]);
	const movieItems = movies.map(movieToMediaItem);
	const showItems = shows.map(tvShowToMediaItem);

	return (
		<div className="min-h-screen">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: serializeJsonLd(webSiteJsonLd(lang)),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: serializeJsonLd(organizationJsonLd()),
				}}
			/>
			<HeroSection posters={[...movieItems, ...showItems]} lang={lang} />
			<PreviewSection movies={movieItems} shows={showItems} />
			<FeaturesSection />
			<CTASection lang={lang} />
		</div>
	);
}
