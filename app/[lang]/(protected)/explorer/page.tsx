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
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { buildPageMetadata } from '@/lib/metadata';
import type { Movie, TvShow, MediaType } from '@/types/tmdb';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return buildPageMetadata(
		t.metadata.explorerTitle,
		t.metadata.explorerDescription
	);
}

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function TrendingSpotlightSection({
	type,
	t,
}: {
	type: MediaType;
	t: Translations;
}) {
	const isMovie = type === 'movie';
	const rawResults = isMovie
		? await getTrendingMovies('week')
		: await getTrendingTvShows('week');
	const items = await mergeWithWatchlist(
		isMovie
			? (rawResults as Movie[]).map(movieToMediaItem)
			: (rawResults as TvShow[]).map(tvShowToMediaItem)
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
				categoryUrl={`/explorer/${isMovie ? 'trending' : 'tv-trending'}`}
			/>
		</>
	);
}

async function PopularSection({
	type,
	t,
}: {
	type: MediaType;
	t: Translations;
}) {
	const isMovie = type === 'movie';
	const rawResults = isMovie
		? await getPopularMovies()
		: await getPopularTvShows();
	const items = await mergeWithWatchlist(
		isMovie
			? (rawResults as Movie[]).map(movieToMediaItem)
			: (rawResults as TvShow[]).map(tvShowToMediaItem)
	);

	return (
		<MediaSection
			title={
				isMovie ? t.pages.explorer.popular : t.pages.explorer.tvPopular
			}
			items={items}
			categoryUrl={`/explorer/${isMovie ? 'popular' : 'tv-popular'}`}
		/>
	);
}

async function TopRatedSection({
	type,
	t,
}: {
	type: MediaType;
	t: Translations;
}) {
	const isMovie = type === 'movie';
	const rawResults = isMovie
		? await getTopRatedMovies()
		: await getTopRatedTvShows();
	const items = await mergeWithWatchlist(
		isMovie
			? (rawResults as Movie[]).map(movieToMediaItem)
			: (rawResults as TvShow[]).map(tvShowToMediaItem)
	);

	return (
		<MediaSection
			title={
				isMovie
					? t.pages.explorer.topRated
					: t.pages.explorer.tvTopRated
			}
			items={items}
			categoryUrl={
				isMovie ? '/explorer/top-rated' : '/explorer/tv-top-rated'
			}
		/>
	);
}

async function UpcomingSection({
	type,
	t,
}: {
	type: MediaType;
	t: Translations;
}) {
	const isMovie = type === 'movie';
	const rawResults = isMovie
		? await getUpcomingMovies()
		: await getAiringTodayTvShows();
	const items = await mergeWithWatchlist(
		isMovie
			? (rawResults as Movie[]).map(movieToMediaItem)
			: (rawResults as TvShow[]).map(tvShowToMediaItem)
	);

	return (
		<MediaSection
			title={
				isMovie
					? t.pages.explorer.upcoming
					: t.pages.explorer.tvAiringToday
			}
			items={items}
			categoryUrl={
				isMovie ? '/explorer/upcoming' : '/explorer/tv-airing-today'
			}
			hideRating={isMovie}
		/>
	);
}

function SpotlightTrendingSkeleton() {
	return (
		<>
			<div className="mb-10 h-52 w-full rounded-[22px] bg-surface-2 animate-pulse sm:h-56" />
			<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
		</>
	);
}

export default async function ExplorerPage({ searchParams }: Props) {
	const params = await searchParams;
	const type: MediaType = params?.type === 'tv' ? 'tv' : 'movie';
	const t = await getTranslations();

	return (
		<PageLayout className="screen-in">
			<PageHeader
				title={t.pages.explorer.title}
				subtitle={t.pages.explorer.subtitle}
			/>

			<SearchBar />

			<div className="mb-8 min-h-14 flex justify-center">
				<Suspense fallback={null}>
					<MediaTypeSwitcher defaultType="movie" />
				</Suspense>
			</div>

			<div className="mb-8 min-h-11">
				<Suspense fallback={null}>
					<CategoryNav />
				</Suspense>
			</div>

			<Suspense fallback={<SpotlightTrendingSkeleton />}>
				<TrendingSpotlightSection type={type} t={t} />
			</Suspense>

			<Suspense
				fallback={
					<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
				}
			>
				<PopularSection type={type} t={t} />
			</Suspense>

			<Suspense
				fallback={
					<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
				}
			>
				<TopRatedSection type={type} t={t} />
			</Suspense>

			<Suspense
				fallback={
					<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
				}
			>
				<UpcomingSection type={type} t={t} />
			</Suspense>
		</PageLayout>
	);
}
