export interface SeasonEpisodeCount {
	seasonNumber: number;
	episodeCount: number;
}

export interface NextEpisode {
	seasonNumber: number;
	episodeNumber: number;
}

const isRegularSeason = (season: SeasonEpisodeCount) =>
	season.seasonNumber > 0 && season.episodeCount > 0;

/**
 * Lowest unwatched (season, episode) pair of a show, specials excluded.
 * Returns null when every regular episode is already watched.
 *
 * @param seasons - Seasons of the show with their episode count.
 * @param watchedBySeason - Watched episode numbers keyed by season number.
 */
export function findNextEpisode(
	seasons: readonly SeasonEpisodeCount[],
	watchedBySeason: ReadonlyMap<number, ReadonlySet<number>>
): NextEpisode | null {
	const ordered = seasons
		.filter(isRegularSeason)
		.sort((a, b) => a.seasonNumber - b.seasonNumber);

	for (const season of ordered) {
		const watched = watchedBySeason.get(season.seasonNumber);
		for (let episode = 1; episode <= season.episodeCount; episode++) {
			if (watched?.has(episode)) continue;
			return {
				seasonNumber: season.seasonNumber,
				episodeNumber: episode,
			};
		}
	}

	return null;
}
