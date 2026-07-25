export interface ResumeCandidate {
	media_id: number;
	created_at: string | null;
}

/**
 * Orders shows for the "continue watching" row: the show whose last episode was watched most
 * recently comes first, then the one furthest along, then the most recently added.
 *
 * @param candidates - Watchlist entries eligible for the row.
 * @param lastWatchedAt - ISO timestamp of the latest watched episode, keyed by show id.
 * @param progress - Watched episode count keyed by show id.
 */
export function orderByWatchRecency<T extends ResumeCandidate>(
	candidates: readonly T[],
	lastWatchedAt: ReadonlyMap<number, string>,
	progress: Readonly<Record<number, number>>
): T[] {
	const watchedAt = (entry: T) => lastWatchedAt.get(entry.media_id) ?? '';

	return [...candidates].sort((a, b) => {
		const byRecency = watchedAt(b).localeCompare(watchedAt(a));
		if (byRecency !== 0) return byRecency;

		const byProgress =
			(progress[b.media_id] ?? 0) - (progress[a.media_id] ?? 0);
		if (byProgress !== 0) return byProgress;

		return (b.created_at ?? '').localeCompare(a.created_at ?? '');
	});
}
