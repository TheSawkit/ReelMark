import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { getUserWatchlist } from '@/app/actions/watchlist';
import { getAllTvShowsWatchProgress } from '@/app/actions/episodes';
import {
	getMovieRecommendations,
	getSimilarMovies,
	getTvShowRecommendations,
	getSimilarTvShows,
	getMovieDetails,
	getTvShowDetails,
	getTrendingMovies,
	getTrendingTvShows,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import {
	MediaSection,
	LibraryMediaSection,
} from '@/components/media/card/MediaSection';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations } from '@/lib/i18n/server';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import {
	DashboardHero,
	type FeaturedHero,
} from '@/components/dashboard/DashboardHero';
import { BentoStats } from '@/components/dashboard/BentoStats';
import { TrendingMarquee } from '@/components/dashboard/TrendingMarquee';
import { buildPageMetadata } from '@/lib/metadata';
import type { Movie, TvShow } from '@/types/tmdb';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();
	return buildPageMetadata(
		t.metadata.dashboardTitle,
		t.metadata.dashboardDescription,
		{ isPrivate: true }
	);
}

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function buildHero(
	watchlist: Awaited<ReturnType<typeof getUserWatchlist>>,
	tvProgress: Record<number, number>
): Promise<FeaturedHero | null> {
	const featured =
		watchlist.find(
			(e) => e.media_type === 'tv' && (tvProgress[e.media_id] ?? 0) > 0
		) ??
		watchlist.find((e) => e.status === 'to_watch') ??
		watchlist[0];
	if (!featured) return null;

	try {
		if (featured.media_type === 'tv') {
			const d = await getTvShowDetails(featured.media_id);
			const watched = tvProgress[featured.media_id] ?? 0;
			return {
				id: d.id,
				media_type: 'tv',
				title: d.name,
				backdropPath: d.backdrop_path,
				posterPath: d.poster_path,
				voteAverage: d.vote_average,
				genres: d.genres,
				progress:
					watched > 0 && d.number_of_episodes > 0
						? { watched, total: d.number_of_episodes }
						: null,
				resume: watched > 0,
			};
		}
		const d = await getMovieDetails(featured.media_id);
		return {
			id: d.id,
			media_type: 'movie',
			title: d.title,
			backdropPath: d.backdrop_path,
			posterPath: d.poster_path,
			voteAverage: d.vote_average,
			genres: d.genres,
			progress: null,
			resume: false,
		};
	} catch {
		return null;
	}
}

export default async function DashboardPage({ searchParams }: Props) {
	await requireAuth();

	const params = await searchParams;
	const type = params?.type === 'tv' ? 'tv' : 'movie';

	const t = await getTranslations();
	const watchlist = await getUserWatchlist();

	const tvIds = watchlist
		.filter((e) => e.media_type === 'tv')
		.map((e) => e.media_id);

	const [tvProgress, trendingMovies, trendingTv] = await Promise.all([
		getAllTvShowsWatchProgress(tvIds),
		getTrendingMovies().catch((): Movie[] => []),
		getTrendingTvShows().catch((): TvShow[] => []),
	]);

	const hero = await buildHero(watchlist, tvProgress);

	const trendingItems = [
		...trendingMovies.slice(0, 10).map(movieToMediaItem),
		...trendingTv.slice(0, 10).map(tvShowToMediaItem),
	].slice(0, 16);

	const moviesWatched = watchlist.filter(
		(e) => e.media_type === 'movie' && e.status === 'watched'
	).length;
	const seriesWatched = watchlist.filter(
		(e) => e.media_type === 'tv' && e.status === 'watched'
	).length;
	const toWatchCount = watchlist.filter(
		(e) => e.status === 'to_watch'
	).length;

	const toWatch = watchlist
		.filter(
			(entry) => entry.media_type === type && entry.status === 'to_watch'
		)
		.slice(0, 10);
	const watched = watchlist.filter(
		(entry) => entry.media_type === type && entry.status === 'watched'
	);
	const seedMedia = watched.slice(0, 4);

	const seedForRecs = seedMedia.slice(0, 1);
	const seedForSimilars = seedMedia.slice(1, 4);

	const isMovie = type === 'movie';
	const getRecs = isMovie
		? getMovieRecommendations
		: getTvShowRecommendations;
	const getSims = isMovie ? getSimilarMovies : getSimilarTvShows;

	const [recommendationsResults, similarResults] = await Promise.all([
		Promise.all(seedForRecs.map((entry) => getRecs(entry.media_id))),
		Promise.all(seedForSimilars.map((entry) => getSims(entry.media_id))),
	]);

	const recommendationSections = seedForRecs
		.map((entry, index) => ({
			title: t.pages.dashboard.basedOn.replace(
				'${movie.movie_title}',
				entry.media_title
			),
			items: isMovie
				? (recommendationsResults[index] as Movie[]).map(movieToMediaItem)
				: (recommendationsResults[index] as TvShow[]).map(
						tvShowToMediaItem
					),
		}))
		.filter((section) => section.items.length > 0);

	const similarSections = seedForSimilars
		.map((entry, index) => ({
			title: t.pages.dashboard.similarTo.replace(
				'${movie.movie_title}',
				entry.media_title
			),
			items: isMovie
				? (similarResults[index] as Movie[]).map(movieToMediaItem)
				: (similarResults[index] as TvShow[]).map(tvShowToMediaItem),
		}))
		.filter((section) => section.items.length > 0);

	const allSections = [...recommendationSections, ...similarSections];
	const isEmpty =
		watchlist.filter((entry) => entry.media_type === type).length === 0;

	return (
		<PageLayout className="screen-in">
			<PageHeader
				title={t.pages.dashboard.welcome}
				subtitle={t.pages.dashboard.subtitle}
			/>

			{hero && (
				<DashboardHero
					item={hero}
					resumeLabel={t.pages.dashboard.resume}
					discoverLabel={t.pages.dashboard.discover}
				/>
			)}

			<BentoStats
				moviesWatched={moviesWatched}
				seriesWatched={seriesWatched}
				toWatch={toWatchCount}
				labels={{
					movies: t.pages.dashboard.statsMoviesWatched,
					series: t.pages.dashboard.statsSeriesWatched,
					toWatch: t.pages.dashboard.statsToWatch,
				}}
			/>

			<TrendingMarquee
				title={t.pages.dashboard.trendingNow}
				items={trendingItems}
			/>

			<Suspense fallback={<div className="h-11.5 mb-8" />}>
				<MediaTypeSwitcher defaultType="movie" />
			</Suspense>

			{toWatch.length > 0 && (
				<LibraryMediaSection
					title={t.pages.dashboard.nextWatchings}
					entries={toWatch}
					categoryUrl="/library"
				/>
			)}

			{allSections.map((section) => (
				<MediaSection
					key={section.title}
					title={section.title}
					items={section.items}
					categoryUrl="/explorer"
				/>
			))}

			{isEmpty && (
				<div className="text-center py-20">
					<p className="text-muted mb-6">
						{t.pages.dashboard.emptyLibrary}
					</p>
					<Link
						href={`/explorer?type=${type}`}
						className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors shadow-cinema"
					>
						{t.pages.dashboard.exploreButton}
					</Link>
				</div>
			)}
		</PageLayout>
	);
}
