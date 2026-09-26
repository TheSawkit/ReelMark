import type { Season } from '@/types/tmdb';

export interface SeasonOption {
	seasonNumber: number;
	name: string;
	episodeCount: number;
	posterPath: string | null;
	watched: number;
}

/** Seasons in viewing order — numbered seasons first, specials (season 0) last — with the viewer's progress. */
export function buildSeasonOptions(
	seasons: Season[],
	progress: Map<number, number>
): SeasonOption[] {
	return seasons
		.filter((season) => season.episode_count > 0)
		.map((season) => ({
			seasonNumber: season.season_number,
			name: season.name,
			episodeCount: season.episode_count,
			posterPath: season.poster_path,
			watched: progress.get(season.season_number) ?? 0,
		}))
		.sort(
			(a, b) =>
				(a.seasonNumber === 0 ? Infinity : a.seasonNumber) -
				(b.seasonNumber === 0 ? Infinity : b.seasonNumber)
		);
}

/** The numbered season that follows `current`, or null at the end of the show (specials have no successor). */
export function nextSeasonOption(
	options: SeasonOption[],
	current: number
): SeasonOption | null {
	if (current === 0) return null;
	return (
		options.find(
			(option) =>
				option.seasonNumber > current && option.seasonNumber !== 0
		) ?? null
	);
}
