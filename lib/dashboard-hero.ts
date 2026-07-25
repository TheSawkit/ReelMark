export interface HeroCandidate {
	id: number;
	progress: { watched: number; total: number } | null;
}

/**
 * Picks the show the hero should feature: the first candidate that still has episodes left,
 * so finishing one from the row below promotes the next without a server render.
 *
 * @param candidates - Resumable shows, most recently watched first.
 * @param watchedOf - Live watched count for a show, given its server-rendered count.
 */
export function pickResumableHero<T extends HeroCandidate>(
	candidates: readonly T[],
	watchedOf: (id: number, serverWatched: number) => number
): T | undefined {
	const stillResumable = (candidate: T) =>
		!candidate.progress ||
		watchedOf(candidate.id, candidate.progress.watched) <
			candidate.progress.total;

	return candidates.find(stillResumable) ?? candidates[0];
}
