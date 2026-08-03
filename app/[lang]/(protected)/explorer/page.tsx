import { Skeleton } from '@/components/ui/skeleton';
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
import { CategoryNav } from '@/components/navigation/CategoryNav';
import { SearchBar } from '@/components/search/SearchBar';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations, type Translations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { TypeSwitched } from '@/components/media/card/TypeSwitched';
import { buildPageMetadata } from '@/lib/metadata';
import type { Movie, TvShow, MediaType } from '@/types/tmdb';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return buildPageMetadata(
		t.metadata.explorerTitle,
		t.metadata.explorerDescription
	);
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

async function TrendingSpotlightSection({
	t,
	lang,
}: {
	t: Translations;
	lang: Language;
}) {
	const section = async (type: MediaType) => {
		const items = await fetchSectionItems(
			type,
			() => getTrendingMovies('week', 1, lang),
			() => getTrendingTvShows('week', 1, lang)
		);
		return (
			<>
				{items.length > 0 && (
					<SpotlightPick
						item={items[0]}
						badgeLabel={t.pages.explorer.featured}
						ctaLabel={t.pages.dashboard.discover}
					/>
				)}
				<MediaSection
					title={t.pages.explorer.top10}
					items={items}
					categoryUrl={`/explorer/${type === 'movie' ? 'trending' : 'tv-trending'}`}
				/>
			</>
		);
	};
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

function SpotlightTrendingSkeleton() {
	return (
		<>
			<Skeleton className="mb-10 h-52 w-full rounded-(--radius-banner) sm:h-56" />
			<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
		</>
	);
}

export default async function ExplorerPage({ params: paramsPromise }: Props) {
	const { lang } = await paramsPromise;
	const t = await getTranslations(lang);

	return (
		<PageLayout>
			<PageHeader
				title={t.pages.explorer.title}
				subtitle={t.pages.explorer.subtitle}
			/>

			<SearchBar />

			<div className="mb-8 min-h-14 flex justify-center">
				<Suspense fallback={null}>
					<MediaTypeSwitcher defaultType="movie" shallow />
				</Suspense>
			</div>

			<div className="mb-8 min-h-11">
				<Suspense fallback={null}>
					<CategoryNav />
				</Suspense>
			</div>

			<Suspense fallback={<SpotlightTrendingSkeleton />}>
				<TrendingSpotlightSection t={t} lang={lang} />
			</Suspense>

			<Suspense
				fallback={
					<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
				}
			>
				<PopularSection t={t} lang={lang} />
			</Suspense>

			<Suspense
				fallback={
					<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
				}
			>
				<TopRatedSection t={t} lang={lang} />
			</Suspense>

			<Suspense
				fallback={
					<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
				}
			>
				<UpcomingSection t={t} lang={lang} />
			</Suspense>
		</PageLayout>
	);
}
