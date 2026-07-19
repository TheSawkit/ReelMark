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
	getMovieCredits,
	getTvShowCredits,
	getUpcomingMovies,
	getOnTheAirTvShows,
	getTrendingMovies,
	getTrendingTvShows,
	getFlatrateProviderIds,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import { getUserRegion } from '@/lib/tmdb/client';
import { getCrewMovieCredits, getCrewTvCredits } from '@/lib/tmdb/crew';
import { movieCreditToMediaItem, tvCreditToMediaItem } from '@/lib/mappers';
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
import { getContinueWatching } from '@/app/actions/continue-watching';
import {
	getCachedDismissals,
	getCachedMyRatings,
	getCachedStreamingProviders,
	getWatchlistWithProgress,
	mergeWithWatchlist,
} from '@/lib/data/watchlist';
import {
	applyDismissals,
	genreAffinity,
	isPersonSeedRating,
	pickFavoritePerson,
	pickSeeds,
	rankRecommendations,
} from '@/lib/recommendations';
import { getMediaKey } from '@/lib/media';
import { buildPageMetadata } from '@/lib/metadata';
import type {
	Movie,
	TvShow,
	MediaType,
	MediaItem,
	Credits,
} from '@/types/tmdb';

export const dynamic = 'force-dynamic';

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
	lang: Language
): Promise<FeaturedHero | null> {
	const candidates = watchlist.filter((e) => e.status !== 'abandoned');
	const featured =
		candidates.find(
			(e) => e.media_type === 'tv' && (tvProgress[e.media_id] ?? 0) > 0
		) ??
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
				resume: watched > 0,
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
	} catch {
		return null;
	}
}

async function HeroSection({ t, lang }: { t: Translations; lang: Language }) {
	const { watchlist, tvProgress } = await getWatchlistWithProgress();
	const hero = await buildHero(watchlist, tvProgress, lang);
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

async function LibraryContentSection({
	t,
	lang,
}: {
	t: Translations;
	lang: Language;
}) {
	const { watchlist, tvProgress } = await getWatchlistWithProgress();
	const [movie, tv] = await Promise.all([
		buildLibraryContent('movie', watchlist, tvProgress, t, lang),
		buildLibraryContent('tv', watchlist, tvProgress, t, lang),
	]);
	return <TypeSwitched movie={movie} tv={tv} />;
}

const ON_SERVICES_CANDIDATES = 12;
const PROVIDER_BATCH_SIZE = 6;

async function buildOnServicesItems(
	type: MediaType,
	forYouItems: MediaItem[],
	myProviderIds: number[],
	lang: Language
): Promise<MediaItem[]> {
	if (myProviderIds.length === 0 || forYouItems.length === 0) return [];

	const region = await getUserRegion(lang);
	const candidates = forYouItems.slice(0, ON_SERVICES_CANDIDATES);
	const mine = new Set(myProviderIds);
	const matches: MediaItem[] = [];

	for (let i = 0; i < candidates.length; i += PROVIDER_BATCH_SIZE) {
		const batch = candidates.slice(i, i + PROVIDER_BATCH_SIZE);
		const providerSets = await Promise.all(
			batch.map((item) =>
				getFlatrateProviderIds(type, item.id, region, lang)
			)
		);
		batch.forEach((item, index) => {
			if (providerSets[index].some((id) => mine.has(id))) {
				matches.push(item);
			}
		});
	}

	return matches;
}

async function buildPersonSection(
	type: MediaType,
	personCredits: Credits[],
	excludedKeys: Set<string>,
	t: Translations,
	lang: Language
): Promise<{ title: string; items: MediaItem[] } | null> {
	const favoritePerson = pickFavoritePerson(
		personCredits.map((credits) => ({
			directors: credits.crew
				.filter((member) => member.job === 'Director')
				.map(({ id, name }) => ({ id, name })),
			cast: credits.cast
				.slice(0, 5)
				.map(({ id, name }) => ({ id, name })),
		}))
	);
	if (!favoritePerson) return null;

	const filmography =
		type === 'movie'
			? (await getCrewMovieCredits(favoritePerson.id, lang)).cast.map(
					movieCreditToMediaItem
				)
			: (await getCrewTvCredits(favoritePerson.id, lang)).cast.map(
					tvCreditToMediaItem
				);

	const seen = new Set<string>();
	const items = filmography
		.filter((item) => {
			const key = getMediaKey(item);
			if (
				item.poster_path === null ||
				excludedKeys.has(key) ||
				seen.has(key)
			) {
				return false;
			}
			seen.add(key);
			return true;
		})
		.sort((a, b) => b.popularity - a.popularity)
		.slice(0, 20);

	if (items.length === 0) return null;

	return {
		title: t.pages.dashboard.becauseYouLike.replace(
			'${name}',
			favoritePerson.name
		),
		items,
	};
}

async function buildLibraryContent(
	type: MediaType,
	watchlist: Awaited<
		ReturnType<typeof getWatchlistWithProgress>
	>['watchlist'],
	tvProgress: Awaited<
		ReturnType<typeof getWatchlistWithProgress>
	>['tvProgress'],
	t: Translations,
	lang: Language
) {
	const typeEntries = watchlist.filter((entry) => entry.media_type === type);
	const toWatch = typeEntries
		.filter((entry) => entry.status === 'to_watch')
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
	const watched = typeEntries.filter((entry) => entry.status === 'watched');
	const seedForSimilars = watched.slice(0, 3);

	const isMovie = type === 'movie';
	const getRecs = isMovie
		? getMovieRecommendations
		: getTvShowRecommendations;
	const getSims = isMovie ? getSimilarMovies : getSimilarTvShows;

	const getCredits = isMovie ? getMovieCredits : getTvShowCredits;

	const [ratingByKey, dismissals, myProviderIds] = await Promise.all([
		getCachedMyRatings(),
		getCachedDismissals(),
		getCachedStreamingProviders(),
	]);
	const seeds = pickSeeds(typeEntries, ratingByKey);
	const personSeedEntries = watched
		.filter((entry) =>
			isPersonSeedRating(
				ratingByKey[
					getMediaKey({
						media_type: entry.media_type,
						id: entry.media_id,
					})
				]
			)
		)
		.slice(0, 4);

	const [recommendationsResults, similarResults, personCredits, freshRaw] =
		await Promise.all([
			Promise.all(
				seeds.map(({ entry }) => getRecs(entry.media_id, lang))
			),
			Promise.all(
				seedForSimilars.map((entry) => getSims(entry.media_id, lang))
			),
			Promise.all(
				personSeedEntries.map((entry) =>
					getCredits(entry.media_id, lang).catch(() => null)
				)
			),
			(isMovie
				? getUpcomingMovies(1, lang)
				: getOnTheAirTvShows(1, lang)
			).catch((): Movie[] | TvShow[] => []),
		]);

	const seedCandidates = seeds.map(({ weight }, index) => ({
		weight,
		items: isMovie
			? (recommendationsResults[index] as Movie[]).map(movieToMediaItem)
			: (recommendationsResults[index] as TvShow[]).map(
					tvShowToMediaItem
				),
	}));
	const excludedKeys = new Set(
		typeEntries.map((entry) =>
			getMediaKey({ media_type: entry.media_type, id: entry.media_id })
		)
	);
	const affinity = genreAffinity(typeEntries, ratingByKey);
	applyDismissals(
		excludedKeys,
		affinity,
		dismissals.filter((dismissal) => dismissal.media_type === type)
	);
	const forYouItems = rankRecommendations(
		seedCandidates,
		excludedKeys,
		affinity
	);

	const onServicesItems = await buildOnServicesItems(
		type,
		forYouItems,
		myProviderIds,
		lang
	);

	const personSection = await buildPersonSection(
		type,
		personCredits.filter(
			(credits): credits is NonNullable<typeof credits> =>
				credits !== null
		),
		excludedKeys,
		t,
		lang
	);

	const freshItems = (
		isMovie
			? (freshRaw as Movie[]).map(movieToMediaItem)
			: (freshRaw as TvShow[]).map(tvShowToMediaItem)
	)
		.filter(
			(item) =>
				item.poster_path !== null &&
				!excludedKeys.has(getMediaKey(item)) &&
				(item.genre_ids ?? []).some((genreId) =>
					affinity.favorites.has(genreId)
				)
		)
		.slice(0, 20);

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

	const extraSections = [
		...(onServicesItems.length > 0
			? [
					{
						title: t.pages.dashboard.onYourServices,
						items: onServicesItems,
					},
				]
			: []),
		...(personSection ? [personSection] : []),
		...(freshItems.length > 0
			? [
					{
						title: isMovie
							? t.pages.dashboard.upcomingForYou
							: t.pages.dashboard.onAirForYou,
						items: freshItems,
					},
				]
			: []),
		...(await Promise.all(
			similarSections.map(async (section) => ({
				...section,
				items: await mergeWithWatchlist(section.items),
			}))
		)),
	];
	const isEmpty = typeEntries.length === 0;
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
