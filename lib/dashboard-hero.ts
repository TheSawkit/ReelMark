export interface HeroCandidate {
	id: number;
	progress: { watched: number; total: number } | null;
}

type WatchedOf = (id: number, serverWatched: number) => number;

function isResumable(candidate: HeroCandidate, watchedOf: WatchedOf): boolean {
	return (
		!candidate.progress ||
		watchedOf(candidate.id, candidate.progress.watched) <
			candidate.progress.total
	);
}

/**
 * Picks the show the hero should feature: the one the user just watched an episode of, else
 * the first candidate with episodes left. Both cases resolve client-side, so ticking an
 * episode from the row below moves the hero without waiting for a server render.
 *
 * @param candidates - Resumable shows, most recently watched first.
 * @param watchedOf - Live watched count for a show, given its server-rendered count.
 * @param justWatchedId - Show ticked most recently in this session, if any.
 */
export function pickResumableHero<T extends HeroCandidate>(
	candidates: readonly T[],
	watchedOf: WatchedOf,
	justWatchedId?: number | null
): T | undefined {
	const stillResumable = (candidate: T) => isResumable(candidate, watchedOf);

	const justWatched =
		justWatchedId == null
			? undefined
			: candidates.find(
					(candidate) =>
						candidate.id === justWatchedId &&
						stillResumable(candidate)
				);

	return justWatched ?? candidates.find(stillResumable) ?? candidates[0];
}

/** Slides of the dashboard hero: the featured show first, then the other shows still resumable, capped at `limit`. */
export function resumableSlides<T extends HeroCandidate>(
	candidates: readonly T[],
	watchedOf: WatchedOf,
	justWatchedId: number | null,
	limit: number
): T[] {
	const lead = pickResumableHero(candidates, watchedOf, justWatchedId);
	if (!lead) return [];
	const others = candidates.filter(
		(candidate) => candidate !== lead && isResumable(candidate, watchedOf)
	);
	return [lead, ...others].slice(0, limit);
}
