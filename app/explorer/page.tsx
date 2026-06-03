import { Suspense } from 'react';
import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
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
import { mergeMediaWithWatchlist } from '@/app/actions/media';
import { MediaSection } from '@/components/media/card/MediaSection';
import { SpotlightPick } from '@/components/explorer/SpotlightPick';
import { CategoryNav } from '@/components/navigation/CategoryNav';
import { SearchBar } from '@/components/search/SearchBar';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations } from '@/lib/i18n/server';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { buildPageMetadata } from '@/lib/metadata';
import type { Movie, TvShow } from '@/types/tmdb';

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

export default async function ExplorerPage({ searchParams }: Props) {
	await requireAuth();

	const params = await searchParams;
	const type = params?.type === 'tv' ? 'tv' : 'movie';
	const t = await getTranslations();

	const isMovie = type === 'movie';

	const [trending, popular, extra1, extra2] = await Promise.all(
		isMovie
			? [
					getTrendingMovies('week'),
					getPopularMovies(),
					getTopRatedMovies(),
					getUpcomingMovies(),
				]
			: [
					getTrendingTvShows('week'),
					getPopularTvShows(),
					getTopRatedTvShows(),
					getAiringTodayTvShows(),
				]
	);

	const trendingItems = await mergeMediaWithWatchlist(
		isMovie
			? (trending as Movie[]).map(movieToMediaItem)
			: (trending as TvShow[]).map(tvShowToMediaItem)
	);
	const popularItems = await mergeMediaWithWatchlist(
		isMovie
			? (popular as Movie[]).map(movieToMediaItem)
			: (popular as TvShow[]).map(tvShowToMediaItem)
	);

	const extraItems1 = {
		title: isMovie
			? t.pages.explorer.topRated
			: t.pages.explorer.tvTopRated,
		items: await mergeMediaWithWatchlist(
			isMovie
				? (extra1 as Movie[]).map(movieToMediaItem)
				: (extra1 as TvShow[]).map(tvShowToMediaItem)
		),
		categoryUrl: isMovie ? '/explorer/top-rated' : '/explorer/tv-top-rated',
	};

	const extraItems2 = {
		title: isMovie
			? t.pages.explorer.upcoming
			: t.pages.explorer.tvAiringToday,
		items: await mergeMediaWithWatchlist(
			isMovie
				? (extra2 as Movie[]).map(movieToMediaItem)
				: (extra2 as TvShow[]).map(tvShowToMediaItem)
		),
		categoryUrl: isMovie
			? '/explorer/upcoming'
			: '/explorer/tv-airing-today',
	};

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

			{trendingItems.length > 0 && (
				<SpotlightPick
					item={trendingItems[0]}
					badgeLabel={t.pages.explorer.featured}
					ctaLabel={t.pages.dashboard.discover}
				/>
			)}

			<MediaSection
				title={t.pages.explorer.top10}
				items={trendingItems}
				categoryUrl={`/explorer/${type === 'movie' ? 'trending' : 'tv-trending'}`}
			/>

			<MediaSection
				title={
					type === 'movie'
						? t.pages.explorer.popular
						: t.pages.explorer.tvPopular
				}
				items={popularItems}
				categoryUrl={`/explorer/${type === 'movie' ? 'popular' : 'tv-popular'}`}
			/>

			<MediaSection
				title={extraItems1.title}
				items={extraItems1.items}
				categoryUrl={extraItems1.categoryUrl}
			/>
			<MediaSection
				title={extraItems2.title}
				items={extraItems2.items}
				categoryUrl={extraItems2.categoryUrl}
				hideRating={isMovie}
			/>
		</PageLayout>
	);
}
