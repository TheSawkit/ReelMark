import type { MediaItem, WatchlistEntry } from '@/types/tmdb';
import { getMediaKey } from '@/lib/media';

const MAX_SEEDS = 6;
const RESULT_SIZE = 20;
const MIN_LIKED_RATING = 4;
const MIN_FAVORITE_RATING = 6;
const MIN_PERSON_RATING = 8;
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

/**
 * Picks the strongest recommendation seeds for a user. Rated titles need at least
 * 2 stars (4/10); an unrated watched title counts as liked; abandoned shows and
 * poorly rated titles never seed.
 */
export function pickSeeds(
	entries: WatchlistEntry[],
	ratingByKey: Record<string, number>
): RecommendationSeed[] {
	const rating = ratingLookup(ratingByKey);
	const usable = entries.filter((entry) => !isDisliked(entry, rating(entry)));

	const watched = usable.filter((entry) => entry.status === 'watched');
	const rated = watched
		.filter((entry) => rating(entry) !== undefined)
		.sort((a, b) => (rating(b) ?? 0) - (rating(a) ?? 0));
	const unrated = watched.filter((entry) => rating(entry) === undefined);
	const toWatch = usable.filter((entry) => entry.status === 'to_watch');

	return [...rated, ...unrated, ...toWatch]
		.slice(0, MAX_SEEDS)
		.map((entry) => ({ entry, weight: seedWeight(rating(entry)) }));
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

/**
 * Picks the person (director first, then recurring lead actor) most present across
 * the user's top-rated titles — the seed for a "Because you like X" row.
 */
export function pickFavoritePerson(
	creditsBySeed: Array<{
		directors: Array<{ id: number; name: string }>;
		cast: Array<{ id: number; name: string }>;
	}>
): { id: number; name: string } | null {
	const scores = new Map<number, { name: string; score: number }>();
	const bump = (person: { id: number; name: string }, amount: number) => {
		const previous = scores.get(person.id);
		scores.set(person.id, {
			name: person.name,
			score: (previous?.score ?? 0) + amount,
		});
	};

	for (const credits of creditsBySeed) {
		for (const director of credits.directors) bump(director, 2);
		for (const actor of credits.cast.slice(0, 5)) bump(actor, 1);
	}

	let best: { id: number; name: string; score: number } | null = null;
	for (const [id, { name, score }] of scores) {
		if (score >= 3 && (!best || score > best.score)) {
			best = { id, name, score };
		}
	}
	return best ? { id: best.id, name: best.name } : null;
}

/** Rating threshold above which a title's people count toward the favourite person. */
export function isPersonSeedRating(rating: number | undefined): boolean {
	return rating !== undefined && rating >= MIN_PERSON_RATING;
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
