import type {
	MediaItem,
	RecommendationReason,
	RecommendationSource,
	WatchlistEntry,
} from '@/types/tmdb';
import { getMediaKey } from '@/lib/media';

const MAX_SEEDS = 6;
const MAX_IN_PROGRESS_SEEDS = 2;
const MAX_TOP_RATED_SEEDS = 3;
const IN_PROGRESS_WEIGHT = 1.4;
const RESULT_SIZE = 20;
const MIN_LIKED_RATING = 4;
const MIN_FAVORITE_RATING = 6;
const MIN_PERSON_RATING = 8;
const MAX_PERSON_SEEDS = 4;
const FAVORITE_GENRES = 3;
const GENRE_BONUS = 0.35;
const GENRE_PENALTY = 0.5;
const RANK_DECAY = 0.04;
const GENRE_CAP = 6;
const RATING_SPREAD = 5;
const DISMISSALS_TO_DISLIKE = 2;
const MAX_SIMILAR_SEEDS = 3;

export interface RecommendationSeed {
	entry: WatchlistEntry;
	weight: number;
	reason: RecommendationReason;
}

export interface SeedCandidates {
	weight: number;
	because?: RecommendationSource;
	items: MediaItem[];
}

export interface GenreAffinity {
	favorites: Set<number>;
	disliked: Set<number>;
}

/** Everything the engine reads about a user's tastes: ratings and when they were given, keyed by media key, and episode progress per show. */
export interface TasteProfile {
	ratings: Readonly<Record<string, number>>;
	ratedAt: Readonly<Record<string, string>>;
	episodesWatched: Readonly<Record<number, number>>;
}

function entryKey(entry: WatchlistEntry): string {
	return getMediaKey({ media_type: entry.media_type, id: entry.media_id });
}

function ratingOf(
	ratings: Readonly<Record<string, number>>,
	entry: WatchlistEntry
): number | undefined {
	return ratings[entryKey(entry)];
}

function seedWeight(rating: number | undefined): number {
	if (rating === undefined) return 1.1;
	if (rating >= 9) return 1.6;
	if (rating >= 8) return 1.4;
	if (rating >= 7) return 1.25;
	if (rating >= 6) return 1.1;
	return 0.9;
}

function isDisliked(
	entry: WatchlistEntry,
	rating: number | undefined
): boolean {
	if (entry.status === 'abandoned') return true;
	return rating !== undefined && rating < MIN_LIKED_RATING;
}

function isLiked(rating: number | undefined): boolean {
	return rating === undefined || rating >= MIN_FAVORITE_RATING;
}

function latestActivity(
	entry: WatchlistEntry,
	ratedAt: Readonly<Record<string, string>>
): string {
	const rated = ratedAt[entryKey(entry)] ?? '';
	const added = entry.created_at ?? '';
	return rated > added ? rated : added;
}

function mostRecentFirst(
	entries: readonly WatchlistEntry[],
	ratedAt: Readonly<Record<string, string>>
): WatchlistEntry[] {
	return entries
		.map((entry) => ({ entry, activity: latestActivity(entry, ratedAt) }))
		.sort((a, b) => b.activity.localeCompare(a.activity))
		.map(({ entry }) => entry);
}

function isInProgress(
	entry: WatchlistEntry,
	episodesWatched: Readonly<Record<number, number>>
): boolean {
	return (
		entry.media_type === 'tv' &&
		entry.status === 'to_watch' &&
		(episodesWatched[entry.media_id] ?? 0) > 0 &&
		!isConsumed(entry, episodesWatched)
	);
}

function seedReason(
	entry: WatchlistEntry,
	rating: number | undefined,
	watching: boolean
): RecommendationReason {
	if (watching) return 'watching';
	if (entry.status !== 'watched') return 'listed';
	return isLiked(rating) ? 'liked' : 'watched';
}

/** Seeds the "For you" row from what the user watches now and loves most, so it follows current tastes rather than all-time favourites. */
export function pickSeeds(
	entries: WatchlistEntry[],
	profile: TasteProfile
): RecommendationSeed[] {
	const rating = (entry: WatchlistEntry) => ratingOf(profile.ratings, entry);
	const usable = mostRecentFirst(entries, profile.ratedAt).filter(
		(entry) => !isDisliked(entry, rating(entry))
	);

	const watched = usable.filter((entry) => entry.status === 'watched');
	const inProgress = usable
		.filter((entry) => isInProgress(entry, profile.episodesWatched))
		.slice(0, MAX_IN_PROGRESS_SEEDS);
	const topRated = watched
		.filter((entry) => rating(entry) !== undefined)
		.sort((a, b) => (rating(b) ?? 0) - (rating(a) ?? 0))
		.slice(0, MAX_TOP_RATED_SEEDS);
	const recentLiked = watched.filter((entry) => isLiked(rating(entry)));
	const toWatch = usable.filter((entry) => entry.status === 'to_watch');

	const ordered = new Set([
		...inProgress,
		...topRated,
		...recentLiked,
		...watched,
		...toWatch,
	]);

	return [...ordered].slice(0, MAX_SEEDS).map((entry) => {
		const watching = inProgress.includes(entry);
		const weight = seedWeight(rating(entry));
		return {
			entry,
			weight: watching ? Math.max(IN_PROGRESS_WEIGHT, weight) : weight,
			reason: seedReason(entry, rating(entry), watching),
		};
	});
}

function tasteSignal(
	entry: WatchlistEntry,
	rating: number | undefined,
	meanRating: number,
	episodesWatched: Readonly<Record<number, number>>
): number {
	if (isDisliked(entry, rating)) return -1;
	if (!isLiked(rating)) return 0;
	if (rating !== undefined) return 1 + (rating - meanRating) / RATING_SPREAD;
	const seen =
		entry.status === 'watched' || isInProgress(entry, episodesWatched);
	return seen ? 1 : 0;
}

function addToGenres(
	totals: Map<number, number>,
	genreIds: number[],
	amount: number
): void {
	for (const genreId of genreIds) {
		totals.set(genreId, (totals.get(genreId) ?? 0) + amount);
	}
}

/** Derives favourite and disliked genres from what the user saw or rated, each rating weighed against their own average. */
export function genreAffinity(
	entries: WatchlistEntry[],
	profile: TasteProfile
): GenreAffinity {
	const rating = (entry: WatchlistEntry) => ratingOf(profile.ratings, entry);
	const ratings = entries
		.map(rating)
		.filter((value): value is number => value !== undefined);
	const meanRating =
		ratings.length > 0
			? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
			: 0;

	const positive = new Map<number, number>();
	const negative = new Map<number, number>();
	for (const entry of entries) {
		const signal = tasteSignal(
			entry,
			rating(entry),
			meanRating,
			profile.episodesWatched
		);
		if (signal === 0) continue;
		addToGenres(
			signal > 0 ? positive : negative,
			entry.genre_ids ?? [],
			Math.abs(signal)
		);
	}

	const outweighs = (
		totals: Map<number, number>,
		other: Map<number, number>
	) =>
		[...totals.entries()].filter(
			([genreId, weight]) => weight > (other.get(genreId) ?? 0)
		);

	const favorites = new Set(
		outweighs(positive, negative)
			.sort((a, b) => b[1] - a[1])
			.slice(0, FAVORITE_GENRES)
			.map(([genreId]) => genreId)
	);
	const disliked = new Set(
		outweighs(negative, positive).map(([genreId]) => genreId)
	);
	return { favorites, disliked };
}

/**
 * Whether the user is done with a title: a watched movie, or a show either marked watched
 * or with every episode ticked. A show left mid-way — or abandoned — is not done, so it can
 * still be suggested.
 *
 * @param entry - Watchlist entry to judge.
 * @param episodesWatched - Watched episode count per show id.
 */
export function isConsumed(
	entry: WatchlistEntry,
	episodesWatched: Readonly<Record<number, number>>
): boolean {
	if (entry.media_type === 'movie') return entry.status === 'watched';
	if (entry.status === 'watched') return true;
	const total = entry.total_episodes ?? 0;
	return total > 0 && (episodesWatched[entry.media_id] ?? 0) >= total;
}

/** Keys of every title the user is done with — what suggestions must never surface again. */
export function consumedKeys(
	entries: readonly WatchlistEntry[],
	episodesWatched: Readonly<Record<number, number>>
): Set<string> {
	const keys = new Set<string>();
	for (const entry of entries) {
		if (!isConsumed(entry, episodesWatched)) continue;
		keys.add(entryKey(entry));
	}
	return keys;
}

export interface DismissedRecommendation {
	media_id: number;
	media_type: WatchlistEntry['media_type'];
	genre_ids: number[];
}

/** Folds "not interested" clicks into the ranking: the title is excluded, and a genre dismissed repeatedly becomes disliked unless it is a favourite. */
export function applyDismissals(
	excludedKeys: Set<string>,
	affinity: GenreAffinity,
	dismissals: DismissedRecommendation[]
): void {
	const dismissalsPerGenre = new Map<number, number>();
	for (const dismissal of dismissals) {
		excludedKeys.add(
			getMediaKey({
				media_type: dismissal.media_type,
				id: dismissal.media_id,
			})
		);
		addToGenres(dismissalsPerGenre, dismissal.genre_ids, 1);
	}
	for (const [genreId, count] of dismissalsPerGenre) {
		if (
			count >= DISMISSALS_TO_DISLIKE &&
			!affinity.favorites.has(genreId)
		) {
			affinity.disliked.add(genreId);
		}
	}
}

/** The watched titles the user liked most recently (added or rated) — each one opens a "Similar to X" row. */
export function pickSimilarSeeds(
	entries: WatchlistEntry[],
	profile: TasteProfile
): WatchlistEntry[] {
	return mostRecentFirst(entries, profile.ratedAt)
		.filter(
			(entry) =>
				entry.status === 'watched' &&
				isLiked(ratingOf(profile.ratings, entry))
		)
		.slice(0, MAX_SIMILAR_SEEDS);
}

type PersonRole = 'director' | 'actor';

export interface FavoritePerson {
	id: number;
	name: string;
	role: PersonRole;
}

/** The director or lead actor most present across the user's top-rated titles, with the role that earned the pick — the seed of a "Because you like X" row. */
export function pickFavoritePerson(
	creditsBySeed: Array<{
		directors: Array<{ id: number; name: string }>;
		cast: Array<{ id: number; name: string }>;
	}>
): FavoritePerson | null {
	const scores = new Map<
		number,
		{ name: string } & Record<PersonRole, number>
	>();
	const bump = (
		person: { id: number; name: string },
		role: PersonRole,
		amount: number
	) => {
		const current = scores.get(person.id) ?? {
			name: person.name,
			director: 0,
			actor: 0,
		};
		current[role] += amount;
		scores.set(person.id, current);
	};

	for (const credits of creditsBySeed) {
		for (const director of credits.directors) bump(director, 'director', 2);
		for (const actor of credits.cast.slice(0, 5)) bump(actor, 'actor', 1);
	}

	let best: FavoritePerson | null = null;
	let bestScore = 0;
	for (const [id, { name, director, actor }] of scores) {
		const score = director + actor;
		if (score >= 3 && score > bestScore) {
			best = { id, name, role: director >= actor ? 'director' : 'actor' };
			bestScore = score;
		}
	}
	return best;
}

/** Rating threshold above which a title's people count toward the favourite person. */
export function isPersonSeedRating(rating: number | undefined): boolean {
	return rating !== undefined && rating >= MIN_PERSON_RATING;
}

/** Watched entries rated high enough for their credits to reveal a favourite director or actor. */
export function pickPersonSeeds(
	watched: WatchlistEntry[],
	ratings: Readonly<Record<string, number>>
): WatchlistEntry[] {
	return watched
		.filter((entry) => isPersonSeedRating(ratingOf(ratings, entry)))
		.slice(0, MAX_PERSON_SEEDS);
}

/** Keeps newly released titles the viewer has not consumed and whose genres match their favourites. */
export function filterFreshItems(
	items: MediaItem[],
	excludedKeys: Set<string>,
	affinity: GenreAffinity
): MediaItem[] {
	return items
		.filter(
			(item) =>
				item.poster_path !== null &&
				!excludedKeys.has(getMediaKey(item)) &&
				(item.genre_ids ?? []).some((genreId) =>
					affinity.favorites.has(genreId)
				)
		)
		.slice(0, RESULT_SIZE);
}

function applyGenreCap(
	sorted: Array<{ item: MediaItem; score: number }>
): MediaItem[] {
	const genreCounts = new Map<number, number>();
	const picked: MediaItem[] = [];
	const skipped: MediaItem[] = [];

	for (const { item } of sorted) {
		if (picked.length >= RESULT_SIZE) break;
		const genres = item.genre_ids ?? [];
		const saturated =
			genres.length > 0 &&
			genres.every(
				(genreId) => (genreCounts.get(genreId) ?? 0) >= GENRE_CAP
			);
		if (saturated) {
			skipped.push(item);
			continue;
		}
		picked.push(item);
		addToGenres(genreCounts, genres, 1);
	}

	return [...picked, ...skipped].slice(0, RESULT_SIZE);
}

/** Ranks TMDB candidates across seeds by weighted frequency and genre affinity, credits each to its strongest seed, and caps any single genre. */
export function rankRecommendations(
	seedCandidates: SeedCandidates[],
	excludedKeys: Set<string>,
	affinity: GenreAffinity
): MediaItem[] {
	const scored = new Map<
		string,
		{
			item: MediaItem;
			score: number;
			source?: { amount: number; because: RecommendationSource };
		}
	>();

	for (const { weight, because, items } of seedCandidates) {
		items.forEach((item, index) => {
			const key = getMediaKey(item);
			if (excludedKeys.has(key)) return;
			const amount = weight * Math.max(0.2, 1 - index * RANK_DECAY);
			const previous = scored.get(key);
			const best = previous?.source;
			const takesSource = because && (!best || amount > best.amount);
			scored.set(key, {
				item: previous?.item ?? item,
				score: (previous?.score ?? 0) + amount,
				source: takesSource ? { amount, because } : best,
			});
		});
	}

	for (const entry of scored.values()) {
		const genres = entry.item.genre_ids ?? [];
		const bonusMatches = genres.filter((genreId) =>
			affinity.favorites.has(genreId)
		).length;
		const penaltyMatches = genres.filter((genreId) =>
			affinity.disliked.has(genreId)
		).length;
		entry.score +=
			Math.min(bonusMatches, FAVORITE_GENRES) * GENRE_BONUS -
			Math.min(penaltyMatches, 2) * GENRE_PENALTY +
			(entry.item.vote_average ?? 0) / 100;
		if (entry.source) {
			entry.item = { ...entry.item, becauseOf: entry.source.because };
		}
	}

	return applyGenreCap(
		[...scored.values()].sort((a, b) => b.score - a.score)
	);
}

/** The single title to suggest this week, ranked like the dashboard, never one in the user's list, dismissed or suggested before. */
export function pickSuggestion(
	entries: WatchlistEntry[],
	profile: TasteProfile,
	dismissals: DismissedRecommendation[],
	seedCandidates: SeedCandidates[],
	alreadySuggested: Set<string>
): MediaItem | null {
	const excluded = new Set([...alreadySuggested, ...entries.map(entryKey)]);
	const affinity = genreAffinity(entries, profile);
	applyDismissals(excluded, affinity, dismissals);
	return rankRecommendations(seedCandidates, excluded, affinity)[0] ?? null;
}
