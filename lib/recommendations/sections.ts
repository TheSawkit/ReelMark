import {
	getMovieRecommendations,
	getSimilarMovies,
	getTvShowRecommendations,
	getSimilarTvShows,
	getMovieCredits,
	getTvShowCredits,
	getUpcomingMovies,
	getOnTheAirTvShows,
	getFlatrateProviderIds,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import { getUserRegion } from '@/lib/tmdb/client';
import { getCrewMovieCredits, getCrewTvCredits } from '@/lib/tmdb/crew';
import { movieCreditToMediaItem, tvCreditToMediaItem } from '@/lib/mappers';
import {
	getCachedDismissals,
	getCachedMyRatings,
	getCachedStreamingProviders,
	getWatchlistWithProgress,
	mergeWithWatchlist,
} from '@/lib/data/watchlist';
import {
	applyDismissals,
	consumedKeys,
	genreAffinity,
	isPersonSeedRating,
	pickFavoritePerson,
	pickSeeds,
	rankRecommendations,
} from '@/lib/recommendations/engine';
import { getMediaKey } from '@/lib/media';
import type { Translations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';
import type {
	Movie,
	TvShow,
	MediaType,
	MediaItem,
	Credits,
} from '@/types/tmdb';

type WatchlistWithProgress = Awaited<
	ReturnType<typeof getWatchlistWithProgress>
>;

const MIN_ROW_ITEMS = 12;
const MAX_RECOMMENDATION_PAGES = 3;

const toMediaItems = (
	results: Movie[] | TvShow[],
	isMovie: boolean
): MediaItem[] =>
	isMovie
		? (results as Movie[]).map(movieToMediaItem)
		: (results as TvShow[]).map(tvShowToMediaItem);

export interface DashboardSection {
	title: string;
	items: MediaItem[];
	categoryUrl?: string;
}

export interface LibrarySections {
	toWatch: WatchlistWithProgress['watchlist'];
	tvProgressMap: Record<number, { watched: number; total: number }>;
	forYouItems: MediaItem[];
	extraSections: DashboardSection[];
	isEmpty: boolean;
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
): Promise<DashboardSection | null> {
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
		categoryUrl: `/crew/${favoritePerson.id}`,
	};
}

/** Assembles every personalized dashboard row for one media type; pure data so the page only renders. */
export async function buildLibrarySections(
	type: MediaType,
	watchlist: WatchlistWithProgress['watchlist'],
	tvProgress: WatchlistWithProgress['tvProgress'],
	t: Translations,
	lang: Language
): Promise<LibrarySections> {
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
		items: toMediaItems(recommendationsResults[index], isMovie),
	}));
	const excludedKeys = consumedKeys(typeEntries, tvProgress);
	const affinity = genreAffinity(typeEntries, ratingByKey);
	applyDismissals(
		excludedKeys,
		affinity,
		dismissals.filter((dismissal) => dismissal.media_type === type)
	);

	let forYouItems = rankRecommendations(
		seedCandidates,
		excludedKeys,
		affinity
	);
	for (
		let page = 2;
		page <= MAX_RECOMMENDATION_PAGES && forYouItems.length < MIN_ROW_ITEMS;
		page++
	) {
		const extraResults = await Promise.all(
			seeds.map(({ entry }) => getRecs(entry.media_id, lang, page))
		);
		seedCandidates.push(
			...seeds.map(({ weight }, index) => ({
				weight,
				items: toMediaItems(extraResults[index], isMovie),
			}))
		);
		forYouItems = rankRecommendations(
			seedCandidates,
			excludedKeys,
			affinity
		);
	}

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
			categoryUrl: `/${type}/${entry.media_id}/similar`,
			items: isMovie
				? (similarResults[index] as Movie[]).map(movieToMediaItem)
				: (similarResults[index] as TvShow[]).map(tvShowToMediaItem),
		}))
		.filter((section) => section.items.length > 0);

	const extraSections: DashboardSection[] = [
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
						categoryUrl: isMovie
							? '/explorer/upcoming'
							: '/explorer/tv-on-the-air',
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

	return {
		toWatch,
		tvProgressMap,
		forYouItems,
		extraSections,
		isEmpty: typeEntries.length === 0,
	};
}
