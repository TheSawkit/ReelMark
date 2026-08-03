export interface TvProgress {
	watched: number;
	total: number;
}

interface TvProgressEntry {
	media_id: number;
	total_episodes?: number | null;
}

/** TMDB IDs whose episode total is missing from the watchlist row and must be fetched. */
export function missingTotalEpisodes(entries: TvProgressEntry[]): number[] {
	return entries
		.filter((entry) => typeof entry.total_episodes !== 'number')
		.map((entry) => entry.media_id);
}

/**
 * Builds the per-show progress map media cards consume, preferring the total stored on the
 * watchlist row and falling back to the freshly fetched one.
 */
export function buildTvProgressMap(
	entries: TvProgressEntry[],
	watchedCounts: Record<number, number>,
	fetchedTotals: Record<number, number>
): Record<number, TvProgress> {
	const progress: Record<number, TvProgress> = {};
	for (const entry of entries) {
		progress[entry.media_id] = {
			watched: watchedCounts[entry.media_id] ?? 0,
			total: entry.total_episodes ?? fetchedTotals[entry.media_id] ?? 0,
		};
	}
	return progress;
}
