import type { MediaItem, WatchlistEntry } from '@/types/tmdb';
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

export interface RecommendationSeed {
	entry: WatchlistEntry;
	weight: number;
}

export interface SeedCandidates {
	weight: number;
	items: MediaItem[];
}

export interface GenreAffinity {
	favorites: Set<number>;
	disliked: Set<number>;
}

type RatingLookup = (entry: WatchlistEntry) => number | undefined;

function ratingLookup(ratingByKey: Record<string, number>): RatingLookup {
	return (entry) =>
		ratingByKey[
			getMediaKey({ media_type: entry.media_type, id: entry.media_id })
		];
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

function newestFirst(entries: readonly WatchlistEntry[]): WatchlistEntry[] {
	return [...entries].sort((a, b) =>
		(b.created_at ?? '').localeCompare(a.created_at ?? '')
	);
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

/**
 * Picks the recommendation seeds for a user, mixing what they watch now with what they
 * love most: shows in progress first, then the best-rated titles, then the latest liked
 * ones, so the row follows current tastes instead of freezing on all-time favourites.
 * Abandoned shows and titles rated under 2 stars (4/10) never seed.
 */
export function pickSeeds(
	entries: WatchlistEntry[],
	ratingByKey: Record<string, number>,
	episodesWatched: Readonly<Record<number, number>> = {}
): RecommendationSeed[] {
	const rating = ratingLookup(ratingByKey);
	const usable = newestFirst(entries).filter(
		(entry) => !isDisliked(entry, rating(entry))
	);

	const watched = usable.filter((entry) => entry.status === 'watched');
	const inProgress = usable
		.filter((entry) => isInProgress(entry, episodesWatched))
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

	return [...ordered].slice(0, MAX_SEEDS).map((entry) => ({
		entry,
		weight: inProgress.includes(entry)
			? Math.max(IN_PROGRESS_WEIGHT, seedWeight(rating(entry)))
			: seedWeight(rating(entry)),
	}));
}

/**
 * Derives the user's genre tastes: favourites from clearly liked titles (rating ≥6
 * or unrated), disliked from abandoned or poorly rated ones — a genre the user
 * still loves elsewhere is never marked disliked.
 */
export function genreAffinity(
	entries: WatchlistEntry[],
	ratingByKey: Record<string, number>
): GenreAffinity {
	const rating = ratingLookup(ratingByKey);
	const liked = new Map<number, number>();
	const negative = new Set<number>();

	for (const entry of entries) {
		const r = rating(entry);
		if (isDisliked(entry, r)) {
			for (const genreId of entry.genre_ids ?? []) negative.add(genreId);
			continue;
		}
		if (r !== undefined && r < MIN_FAVORITE_RATING) continue;
		for (const genreId of entry.genre_ids ?? []) {
			liked.set(genreId, (liked.get(genreId) ?? 0) + 1);
		}
	}

	const favorites = new Set(
		[...liked.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, FAVORITE_GENRES)
			.map(([genreId]) => genreId)
	);
	const disliked = new Set(
		[...negative].filter((genreId) => !liked.has(genreId))
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
		keys.add(
			getMediaKey({ media_type: entry.media_type, id: entry.media_id })
		);
	}
	return keys;
}

export interface DismissedRecommendation {
	media_id: number;
	media_type: WatchlistEntry['media_type'];
	genre_ids: number[];
}

/**
 * Folds explicit "not interested" signals into the ranking inputs: dismissed keys
 * join the exclusion set, and their genres join the disliked set unless the user
 * loves that genre elsewhere.
 */
export function applyDismissals(
	excludedKeys: Set<string>,
	affinity: GenreAffinity,
	dismissals: DismissedRecommendation[]
): void {
	for (const dismissal of dismissals) {
		excludedKeys.add(
			getMediaKey({
				media_type: dismissal.media_type,
				id: dismissal.media_id,
			})
		);
		for (const genreId of dismissal.genre_ids) {
			if (!affinity.favorites.has(genreId)) {
				affinity.disliked.add(genreId);
			}
		}
	}
}

export type PersonRole = 'director' | 'actor';

export interface FavoritePerson {
	id: number;
	name: string;
	role: PersonRole;
}

/**
 * Picks the person (director first, then recurring lead actor) most present across
 * the user's top-rated titles — the seed for a "Because you like X" row. The role says
 * which of their credits earned the pick, so the row lists what they directed or played in.
 */
export function pickFavoritePerson(
	creditsBySeed: Array<{
		directors: Array<{ id: number; name: string }>;
		cast: Array<{ id: number; name: string }>;
	}>
): FavoritePerson | null {
	const scores = new Map<
		number,
		{ name: string; directing: number; acting: number }
	>();
	const bump = (
		person: { id: number; name: string },
		role: 'directing' | 'acting',
		amount: number
	) => {
		const current = scores.get(person.id) ?? {
			name: person.name,
			directing: 0,
			acting: 0,
		};
		current[role] += amount;
		scores.set(person.id, current);
	};

	for (const credits of creditsBySeed) {
		for (const director of credits.directors) bump(director, 'directing', 2);
		for (const actor of credits.cast.slice(0, 5)) bump(actor, 'acting', 1);
	}

	let best: (FavoritePerson & { score: number }) | null = null;
	for (const [id, { name, directing, acting }] of scores) {
		const score = directing + acting;
		if (score >= 3 && (!best || score > best.score)) {
			const role = directing >= acting ? 'director' : 'actor';
			best = { id, name, role, score };
		}
	}
	return best ? { id: best.id, name: best.name, role: best.role } : null;
}

/** Rating threshold above which a title's people count toward the favourite person. */
export function isPersonSeedRating(rating: number | undefined): boolean {
	return rating !== undefined && rating >= MIN_PERSON_RATING;
}

/** Watched entries rated high enough for their credits to reveal a favourite director or actor. */
export function pickPersonSeeds(
	watched: WatchlistEntry[],
	ratingByKey: Record<string, number>
): WatchlistEntry[] {
	const ratingOf = ratingLookup(ratingByKey);
	return watched
		.filter((entry) => isPersonSeedRating(ratingOf(entry)))
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
		for (const genreId of genres) {
			genreCounts.set(genreId, (genreCounts.get(genreId) ?? 0) + 1);
		}
	}

	return [...picked, ...skipped].slice(0, RESULT_SIZE);
}

/**
 * Ranks TMDB candidates across all seeds: weighted seed frequency with positional
 * decay, favourite-genre bonus, disliked-genre penalty, library exclusion, the
 * TMDB score as tie-break, and a per-genre cap so one genre can't fill the row.
 */
export function rankRecommendations(
	seedCandidates: SeedCandidates[],
	excludedKeys: Set<string>,
	affinity: GenreAffinity
): MediaItem[] {
	const scored = new Map<string, { item: MediaItem; score: number }>();

	for (const { weight, items } of seedCandidates) {
		items.forEach((item, index) => {
			const key = getMediaKey(item);
			if (excludedKeys.has(key)) return;
			const rankFactor = Math.max(0.2, 1 - index * RANK_DECAY);
			const previous = scored.get(key);
			scored.set(key, {
				item: previous?.item ?? item,
				score: (previous?.score ?? 0) + weight * rankFactor,
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
	}

	return applyGenreCap(
		[...scored.values()].sort((a, b) => b.score - a.score)
	);
}

/**
 * The single title to suggest this week: best-ranked by the same scoring as the dashboard,
 * never one already in the user's list, dismissed, or suggested before.
 */
export function pickSuggestion(
	entries: WatchlistEntry[],
	ratingByKey: Record<string, number>,
	dismissals: DismissedRecommendation[],
	seedCandidates: SeedCandidates[],
	alreadySuggested: Set<string>
): MediaItem | null {
	const excluded = new Set([
		...alreadySuggested,
		...entries.map((entry) =>
			getMediaKey({ media_type: entry.media_type, id: entry.media_id })
		),
	]);
	const affinity = genreAffinity(entries, ratingByKey);
	applyDismissals(excluded, affinity, dismissals);
	return rankRecommendations(seedCandidates, excluded, affinity)[0] ?? null;
}
