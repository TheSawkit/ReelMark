import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
	getPopularMovies,
	getTopRatedMovies,
	getTrendingMovies,
	getUpcomingMovies,
	getPopularTvShows,
	getTrendingTvShows,
	getAiringTodayTvShows,
	getTopRatedTvShows,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import { mergeWithWatchlist } from '@/lib/data/watchlist';
import { MediaSection } from '@/components/media/card/MediaSection';
import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { SpotlightPick } from '@/components/explorer/SpotlightPick';
import { SpotlightPickSkeleton } from '@/components/explorer/SpotlightPickSkeleton';
import { HeroSlideshow } from '@/components/shared/HeroSlideshow';
import { CategoryNav } from '@/components/navigation/CategoryNav';
import { PageLayout } from '@/components/layout/PageLayout';
import { getTranslations, type Translations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { MediaTypeSwitcherSkeleton } from '@/components/media/card/MediaTypeSwitcherSkeleton';
import { CategoryNavSkeleton } from '@/components/navigation/CategoryNavSkeleton';
import { TypeSwitched } from '@/components/media/card/TypeSwitched';
import { buildPageMetadata, localizedAlternates } from '@/lib/metadata';
import type { Movie, TvShow, MediaType } from '@/types/tmdb';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return {
		...buildPageMetadata(
			t.metadata.explorerTitle,
			t.metadata.explorerDescription
		),
		alternates: localizedAlternates(lang, '/explorer'),
	};
}

type Props = {
	params: Promise<{ lang: Language }>;
};

async function fetchSectionItems(
	type: MediaType,
	fetchMovies: () => Promise<Movie[]>,
	fetchTvShows: () => Promise<TvShow[]>
) {
	return mergeWithWatchlist(
		type === 'movie'
			? (await fetchMovies()).map(movieToMediaItem)
			: (await fetchTvShows()).map(tvShowToMediaItem)
	);
}

const HERO_SLIDES = 5;

async function TrendingHero({ t, lang }: { t: Translations; lang: Language }) {
	const hero = async (type: MediaType) => {
		const featured = (
			await fetchSectionItems(
				type,
				() => getTrendingMovies('week', 1, lang),
				() => getTrendingTvShows('week', 1, lang)
			)
		).slice(0, HERO_SLIDES);
		return featured.length > 0 ? (
			<HeroSlideshow
				label={t.pages.explorer.featured}
				slides={featured.map((item, index) => (
					<SpotlightPick
						key={item.id}
						item={item}
						priority={index === 0}
						badgeLabel={t.pages.explorer.featured}
						ctaLabel={t.pages.dashboard.discover}
					/>
				))}
			/>
		) : null;
	};
	const [movie, tv] = await Promise.all([hero('movie'), hero('tv')]);
	return <TypeSwitched movie={movie} tv={tv} />;
}

async function TopTenSection({ t, lang }: { t: Translations; lang: Language }) {
	const section = async (type: MediaType) => (
		<MediaSection
			title={t.pages.explorer.top10}
			items={await fetchSectionItems(
				type,
				() => getTrendingMovies('week', 1, lang),
				() => getTrendingTvShows('week', 1, lang)
			)}
			categoryUrl={`/explorer/${type === 'movie' ? 'trending' : 'tv-trending'}`}
		/>
	);
	const [movie, tv] = await Promise.all([section('movie'), section('tv')]);
	return <TypeSwitched movie={movie} tv={tv} />;
}

async function PopularSection({
	t,
	lang,
}: {
	t: Translations;
	lang: Language;
}) {
	const section = async (type: MediaType) => (
		<MediaSection
			title={
				type === 'movie'
					? t.pages.explorer.popular
					: t.pages.explorer.tvPopular
			}
			items={await fetchSectionItems(
				type,
				() => getPopularMovies(1, lang),
				() => getPopularTvShows(1, lang)
			)}
			categoryUrl={`/explorer/${type === 'movie' ? 'popular' : 'tv-popular'}`}
		/>
	);
	const [movie, tv] = await Promise.all([section('movie'), section('tv')]);
	return <TypeSwitched movie={movie} tv={tv} />;
}

async function TopRatedSection({
	t,
	lang,
}: {
	t: Translations;
	lang: Language;
}) {
	const section = async (type: MediaType) => (
		<MediaSection
			title={
				type === 'movie'
					? t.pages.explorer.topRated
					: t.pages.explorer.tvTopRated
			}
			items={await fetchSectionItems(
				type,
				() => getTopRatedMovies(1, lang),
				() => getTopRatedTvShows(1, lang)
			)}
			categoryUrl={
				type === 'movie'
					? '/explorer/top-rated'
					: '/explorer/tv-top-rated'
			}
		/>
	);
	const [movie, tv] = await Promise.all([section('movie'), section('tv')]);
	return <TypeSwitched movie={movie} tv={tv} />;
}

async function UpcomingSection({
	t,
	lang,
}: {
	t: Translations;
	lang: Language;
}) {
	const section = async (type: MediaType) => (
		<MediaSection
			title={
				type === 'movie'
					? t.pages.explorer.upcoming
					: t.pages.explorer.tvAiringToday
			}
			items={await fetchSectionItems(
				type,
				() => getUpcomingMovies(1, lang),
				() => getAiringTodayTvShows(1, lang)
			)}
			categoryUrl={
				type === 'movie'
					? '/explorer/upcoming'
					: '/explorer/tv-airing-today'
			}
			hideRating={type === 'movie'}
		/>
	);
	const [movie, tv] = await Promise.all([section('movie'), section('tv')]);
	return <TypeSwitched movie={movie} tv={tv} />;
}

const SECTIONS = [
	{ key: 'top10', Section: TopTenSection },
	{ key: 'popular', Section: PopularSection },
	{ key: 'topRated', Section: TopRatedSection },
	{ key: 'upcoming', Section: UpcomingSection },
] as const;

export default async function ExplorerPage({ params: paramsPromise }: Props) {
	const { lang } = await paramsPromise;
	const t = await getTranslations(lang);

	return (
		<>
			<h1 className="sr-only">{t.pages.explorer.title}</h1>
			<section
				aria-label={t.pages.explorer.featured}
				className="hero-stage relative isolate flex flex-col justify-end overflow-hidden banner-pull-top banner-safe-pad pb-8 sm:pb-12"
			>
				<Suspense fallback={<SpotlightPickSkeleton />}>
					<TrendingHero t={t} lang={lang} />
				</Suspense>
				<div className="absolute inset-x-0 top-0 z-20 banner-safe-pad">
					<Suspense fallback={<MediaTypeSwitcherSkeleton />}>
						<MediaTypeSwitcher defaultType="movie" shallow />
					</Suspense>
				</div>
			</section>

			<PageLayout className="pt-6 lg:pt-8">
				<div className="mb-8 min-h-11">
					<Suspense fallback={<CategoryNavSkeleton />}>
						<CategoryNav />
					</Suspense>
				</div>

				{SECTIONS.map(({ key, Section }) => (
					<Suspense
						key={key}
						fallback={
							<MediaSectionsSkeleton
								sections={1}
								cardsPerSection={8}
							/>
						}
					>
						<Section t={t} lang={lang} />
					</Suspense>
				))}
			</PageLayout>
		</>
	);
}
