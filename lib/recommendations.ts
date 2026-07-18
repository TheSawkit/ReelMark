import type { MediaItem, WatchlistEntry } from '@/types/tmdb';
import { getMediaKey } from '@/lib/media';

const MAX_SEEDS = 6;
const RESULT_SIZE = 20;
const MIN_SEED_RATING = 6;
const FAVORITE_GENRES = 3;
const GENRE_BONUS = 0.35;
const RANK_DECAY = 0.04;

export interface RecommendationSeed {
	entry: WatchlistEntry;
	weight: number;
}

export interface SeedCandidates {
	weight: number;
	items: MediaItem[];
}

function seedWeight(rating: number | undefined): number {
	if (rating === undefined) return 1;
	if (rating >= 9) return 1.6;
	if (rating >= 8) return 1.4;
	if (rating >= 7) return 1.2;
	return 1;
}

/**
 * Picks the strongest recommendation seeds for a user: best-rated watched titles first,
 * then recently watched, then the to-watch list — low-rated titles never seed.
 */
export function pickSeeds(
	entries: WatchlistEntry[],
	ratingByKey: Record<string, number>
): RecommendationSeed[] {
	const rating = (entry: WatchlistEntry) =>
		ratingByKey[
			getMediaKey({ media_type: entry.media_type, id: entry.media_id })
		];

	const usable = entries.filter((entry) => {
		if (entry.status === 'abandoned') return false;
		const r = rating(entry);
		return r === undefined || r >= MIN_SEED_RATING;
	});

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
 * Returns the user's dominant genres for the given entries, by frequency across the library.
 */
export function favoriteGenres(entries: WatchlistEntry[]): Set<number> {
	const counts = new Map<number, number>();
	for (const entry of entries) {
		if (entry.status === 'abandoned') continue;
		for (const genreId of entry.genre_ids ?? []) {
			counts.set(genreId, (counts.get(genreId) ?? 0) + 1);
		}
	}
	return new Set(
		[...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, FAVORITE_GENRES)
			.map(([genreId]) => genreId)
	);
}

/**
 * Ranks TMDB candidates across all seeds: weighted seed frequency with positional decay,
 * a bonus per favourite-genre match, library exclusion, and TMDB score as tie-break.
 */
export function rankRecommendations(
	seedCandidates: SeedCandidates[],
	excludedKeys: Set<string>,
	favorites: Set<number>
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
		const matches = (entry.item.genre_ids ?? []).filter((genreId) =>
			favorites.has(genreId)
		).length;
		entry.score +=
			Math.min(matches, FAVORITE_GENRES) * GENRE_BONUS +
			(entry.item.vote_average ?? 0) / 100;
	}

	return [...scored.values()]
		.sort((a, b) => b.score - a.score)
		.slice(0, RESULT_SIZE)
		.map(({ item }) => item);
}
