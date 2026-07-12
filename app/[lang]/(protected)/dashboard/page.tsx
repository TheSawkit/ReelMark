import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getUserWatchlist } from '@/app/actions/watchlist';
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
import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import {
	getTranslations,
	getServerLanguage,
	type Translations,
} from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import {
	DashboardHero,
	type FeaturedHero,
} from '@/components/dashboard/DashboardHero';
import { BentoStats } from '@/components/dashboard/BentoStats';
import { TrendingMarquee } from '@/components/dashboard/TrendingMarquee';
import {
	DashboardHeroSkeleton,
	BentoStatsSkeleton,
	TrendingMarqueeSkeleton,
} from '@/components/dashboard/DashboardSkeletons';
import {
	getWatchlistWithProgress,
	mergeWithWatchlist,
} from '@/lib/data/watchlist';
import { buildPageMetadata } from '@/lib/metadata';
import type { Movie, TvShow, MediaType } from '@/types/tmdb';

export const dynamic = 'force-dynamic';

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

async function HeroSection({ t }: { t: Translations }) {
	const { watchlist, tvProgress } = await getWatchlistWithProgress();
	const hero = await buildHero(watchlist, tvProgress);
	if (!hero) return null;

	return (
		<DashboardHero
			item={hero}
			resumeLabel={t.pages.dashboard.resume}
			discoverLabel={t.pages.dashboard.discover}
		/>
	);
}

async function StatsSection({ t }: { t: Translations }) {
	const { watchlist, tvProgress } = await getWatchlistWithProgress();

	const moviesWatched = watchlist.filter(
		(e) => e.media_type === 'movie' && e.status === 'watched'
	).length;
	const episodesWatched = Object.values(tvProgress).reduce(
		(sum, n) => sum + n,
		0
	);
	const toWatchCount = watchlist.filter(
		(e) => e.status === 'to_watch'
	).length;

	return (
		<BentoStats
			title={t.pages.dashboard.statsTitle}
			moviesWatched={moviesWatched}
			episodesWatched={episodesWatched}
			toWatch={toWatchCount}
			labels={{
				movies: t.pages.dashboard.statsMoviesWatched,
				episodes: t.pages.dashboard.statsEpisodesWatched,
				toWatch: t.pages.dashboard.statsToWatch,
			}}
		/>
	);
}

async function TrendingSection({ t }: { t: Translations }) {
	const [trendingMovies, trendingTv] = await Promise.all([
		getTrendingMovies().catch((): Movie[] => []),
		getTrendingTvShows().catch((): TvShow[] => []),
	]);

	const trendingItems = await mergeWithWatchlist(
		[
			...trendingMovies.slice(0, 10).map(movieToMediaItem),
			...trendingTv.slice(0, 10).map(tvShowToMediaItem),
		].slice(0, 16)
	);

	return (
		<TrendingMarquee
			title={t.pages.dashboard.trendingNow}
			items={trendingItems}
		/>
	);
}

async function LibraryContentSection({
	type,
	t,
}: {
	type: MediaType;
	t: Translations;
}) {
	const { watchlist, tvProgress } = await getWatchlistWithProgress();

	const toWatch = watchlist
		.filter(
			(entry) => entry.media_type === type && entry.status === 'to_watch'
		)
		.slice(0, 10);

	const tvProgressMap: Record<number, { watched: number; total: number }> =
		{};
	if (type === 'tv') {
		for (const entry of toWatch) {
			if (entry.total_episodes) {
				tvProgressMap[entry.media_id] = {
					watched: tvProgress[entry.media_id] ?? 0,
					total: entry.total_episodes,
				};
			}
		}
	}
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
				? (recommendationsResults[index] as Movie[]).map(
						movieToMediaItem
					)
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

	const allSections = await Promise.all(
		[...recommendationSections, ...similarSections].map(
			async (section) => ({
				...section,
				items: await mergeWithWatchlist(section.items),
			})
		)
	);
	const isEmpty =
		watchlist.filter((entry) => entry.media_type === type).length === 0;
	const lang = await getServerLanguage();

	return (
		<>
			{toWatch.length > 0 && (
				<LibraryMediaSection
					title={t.pages.dashboard.nextWatchings}
					entries={toWatch}
					categoryUrl="/library"
					tvProgress={tvProgressMap}
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
						href={localizedHref(lang, `/explorer?type=${type}`)}
						className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors shadow-cinema"
					>
						{t.pages.dashboard.exploreButton}
					</Link>
				</div>
			)}
		</>
	);
}

export default async function DashboardPage({ searchParams }: Props) {
	const params = await searchParams;
	const type: MediaType = params?.type === 'tv' ? 'tv' : 'movie';
	const t = await getTranslations();

	return (
		<PageLayout className="screen-in">
			<PageHeader
				title={t.pages.dashboard.welcome}
				subtitle={t.pages.dashboard.subtitle}
			/>

			<Suspense fallback={<DashboardHeroSkeleton />}>
				<HeroSection t={t} />
			</Suspense>

			<Suspense fallback={<BentoStatsSkeleton />}>
				<StatsSection t={t} />
			</Suspense>

			<Suspense fallback={<TrendingMarqueeSkeleton />}>
				<TrendingSection t={t} />
			</Suspense>

			<Suspense fallback={<div className="h-11.5 mb-8" />}>
				<MediaTypeSwitcher defaultType="movie" />
			</Suspense>

			<Suspense
				fallback={
					<MediaSectionsSkeleton sections={3} cardsPerSection={8} />
				}
			>
				<LibraryContentSection type={type} t={t} />
			</Suspense>
		</PageLayout>
	);
}
