import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getUserWatchlist } from '@/app/actions/watchlist';
import {
	getMovieDetails,
	getTvShowDetails,
	getTrendingMovies,
	getTrendingTvShows,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import { ForYouSection } from '@/components/dashboard/ForYouSection';
import {
	MediaSection,
	LibraryMediaSection,
} from '@/components/media/card/MediaSection';
import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations, type Translations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';
import { localizedHref } from '@/lib/i18n/utils';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { TypeSwitched } from '@/components/media/card/TypeSwitched';
import {
	DashboardHero,
	type FeaturedHero,
} from '@/components/dashboard/DashboardHero';
import { BentoStats } from '@/components/dashboard/BentoStats';
import { TrendingMarquee } from '@/components/dashboard/TrendingMarquee';
import { ContinueWatchingSection } from '@/components/dashboard/ContinueWatchingSection';
import { ContinueWatchingSkeleton } from '@/components/dashboard/ContinueWatchingSkeleton';
import {
	DashboardHeroSkeleton,
	BentoStatsSkeleton,
	TrendingMarqueeSkeleton,
} from '@/components/dashboard/DashboardSkeletons';
import {
	getContinueWatching,
	type ContinueWatchingItem,
} from '@/lib/data/continue-watching';
import {
	getWatchlistWithProgress,
	mergeWithWatchlist,
} from '@/lib/data/watchlist';
import { buildLibrarySections } from '@/lib/recommendations/sections';
import { reportSwallowed } from '@/lib/report';
import { buildPageMetadata } from '@/lib/metadata';
import type { Movie, TvShow, MediaType } from '@/types/tmdb';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	const t = await getTranslations(lang);
	return buildPageMetadata(
		t.metadata.dashboardTitle,
		t.metadata.dashboardDescription,
		{ isPrivate: true }
	);
}

type Props = {
	params: Promise<{ lang: Language }>;
};

async function buildHero(
	watchlist: Awaited<ReturnType<typeof getUserWatchlist>>,
	tvProgress: Record<number, number>,
	resumable: ContinueWatchingItem | null,
	lang: Language
): Promise<FeaturedHero | null> {
	const candidates = watchlist.filter((e) => e.status !== 'abandoned');
	const featured =
		(resumable &&
			candidates.find(
				(e) => e.media_type === 'tv' && e.media_id === resumable.tvId
			)) ??
		candidates.find((e) => e.status === 'to_watch') ??
		candidates[0];
	if (!featured) return null;

	try {
		if (featured.media_type === 'tv') {
			const d = await getTvShowDetails(featured.media_id, lang);
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
				resume: featured.media_id === resumable?.tvId,
			};
		}
		const d = await getMovieDetails(featured.media_id, lang);
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
	} catch (error) {
		reportSwallowed('dashboard:hero', error);
		return null;
	}
}

async function HeroSection({ t, lang }: { t: Translations; lang: Language }) {
	const [{ watchlist, tvProgress }, resumable] = await Promise.all([
		getWatchlistWithProgress(),
		getContinueWatching(),
	]);
	const hero = await buildHero(
		watchlist,
		tvProgress,
		resumable[0] ?? null,
		lang
	);
	if (!hero) return null;

	return (
		<DashboardHero
			item={hero}
			resumeLabel={t.pages.dashboard.resume}
			discoverLabel={t.pages.dashboard.discover}
		/>
	);
}

async function ContinueWatching() {
	const items = await getContinueWatching();
	return <ContinueWatchingSection items={items} />;
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

async function TrendingSection({
	t,
	lang,
}: {
	t: Translations;
	lang: Language;
}) {
	const [trendingMovies, trendingTv] = await Promise.all([
		getTrendingMovies('week', 1, lang).catch((): Movie[] => []),
		getTrendingTvShows('week', 1, lang).catch((): TvShow[] => []),
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

async function LibraryContent({
	type,
	watchlist,
	tvProgress,
	t,
	lang,
}: {
	type: MediaType;
	watchlist: Awaited<
		ReturnType<typeof getWatchlistWithProgress>
	>['watchlist'];
	tvProgress: Awaited<
		ReturnType<typeof getWatchlistWithProgress>
	>['tvProgress'];
	t: Translations;
	lang: Language;
}) {
	const { toWatch, tvProgressMap, forYouItems, extraSections, isEmpty } =
		await buildLibrarySections(type, watchlist, tvProgress, t, lang);

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

			{forYouItems.length > 0 && (
				<ForYouSection
					title={t.pages.dashboard.forYou}
					items={forYouItems}
				/>
			)}

			{extraSections.map((section) => (
				<MediaSection
					key={section.title}
					title={section.title}
					items={section.items}
					categoryUrl={section.categoryUrl}
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

async function LibraryContentSection({
	t,
	lang,
}: {
	t: Translations;
	lang: Language;
}) {
	const { watchlist, tvProgress } = await getWatchlistWithProgress();
	return (
		<TypeSwitched
			movie={
				<LibraryContent
					type="movie"
					watchlist={watchlist}
					tvProgress={tvProgress}
					t={t}
					lang={lang}
				/>
			}
			tv={
				<LibraryContent
					type="tv"
					watchlist={watchlist}
					tvProgress={tvProgress}
					t={t}
					lang={lang}
				/>
			}
		/>
	);
}

export default async function DashboardPage({ params: paramsPromise }: Props) {
	const { lang } = await paramsPromise;
	const t = await getTranslations(lang);

	return (
		<PageLayout className="screen-in">
			<PageHeader
				title={t.pages.dashboard.welcome}
				subtitle={t.pages.dashboard.subtitle}
			/>

			<Suspense fallback={<DashboardHeroSkeleton />}>
				<HeroSection t={t} lang={lang} />
			</Suspense>

			<Suspense fallback={<ContinueWatchingSkeleton />}>
				<ContinueWatching />
			</Suspense>

			<Suspense fallback={<BentoStatsSkeleton />}>
				<StatsSection t={t} />
			</Suspense>

			<Suspense fallback={<TrendingMarqueeSkeleton />}>
				<TrendingSection t={t} lang={lang} />
			</Suspense>

			<Suspense fallback={<div className="h-11.5 mb-8" />}>
				<MediaTypeSwitcher defaultType="movie" shallow />
			</Suspense>

			<Suspense
				fallback={
					<MediaSectionsSkeleton sections={3} cardsPerSection={8} />
				}
			>
				<LibraryContentSection t={t} lang={lang} />
			</Suspense>
		</PageLayout>
	);
}
