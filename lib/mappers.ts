import type {
	MediaItem,
	CrewMovieCredit,
	CrewTvCredit,
	CrewMovieCrewCredit,
	CrewTvCrewCredit,
	WatchlistEntry,
} from '@/types/tmdb';
import type { PlaylistItem } from '@/types/profile';

/**
 * Converts a watchlist entry into a minimal `MediaItem` for display in media card grids.
 * Fields not stored in the watchlist (overview, vote_average, etc.) default to empty values.
 *
 * @param entry - Watchlist entry from the database.
 * @returns Normalized `MediaItem` usable by `MediaCard` and related components.
 */
export function watchlistEntryToMediaItem(entry: WatchlistEntry): MediaItem {
	return {
		id: entry.media_id,
		media_type: entry.media_type,
		title: entry.media_title,
		original_title: entry.media_title,
		overview: '',
		poster_path: entry.poster_path,
		backdrop_path: null,
		release_date: entry.release_date ?? '',
		vote_average: 0,
		vote_count: 0,
		popularity: 0,
		genre_ids: entry.genre_ids ?? undefined,
		addedAt: entry.created_at,
		watchlistEntry: entry,
	};
}

/**
 * Converts a person's movie credit into a `MediaItem`.
 *
 * @param credit - Movie credit from the TMDB person credits endpoint.
 * @returns Normalized `MediaItem` with `media_type: "movie"`.
 */
export function movieCreditToMediaItem(credit: CrewMovieCredit): MediaItem {
	return {
		id: credit.id,
		media_type: 'movie',
		title: credit.title,
		original_title: credit.title,
		overview: credit.overview,
		poster_path: credit.poster_path,
		backdrop_path: credit.backdrop_path,
		release_date: credit.release_date,
		vote_average: credit.vote_average,
		vote_count: 0,
		popularity: credit.popularity,
		character: credit.character || undefined,
	};
}

/**
 * Converts a person's TV show credit into a `MediaItem`.
 *
 * @param credit - TV credit from the TMDB person credits endpoint.
 * @returns Normalized `MediaItem` with `media_type: "tv"`.
 */
export function tvCreditToMediaItem(credit: CrewTvCredit): MediaItem {
	return {
		id: credit.id,
		media_type: 'tv',
		title: credit.name,
		original_title: credit.name,
		overview: credit.overview,
		poster_path: credit.poster_path,
		backdrop_path: credit.backdrop_path,
		release_date: credit.first_air_date,
		vote_average: credit.vote_average,
		vote_count: 0,
		popularity: credit.popularity,
		character: credit.character || undefined,
	};
}

/**
 * Converts a person's movie crew credit (directing, writing, music…) into a `MediaItem`.
 *
 * @param credit - Movie crew credit from the TMDB person credits endpoint.
 * @returns Normalized `MediaItem` with `media_type: "movie"`.
 */
export function movieCrewCreditToMediaItem(
	credit: CrewMovieCrewCredit
): MediaItem {
	return {
		id: credit.id,
		media_type: 'movie',
		title: credit.title,
		original_title: credit.title,
		overview: credit.overview,
		poster_path: credit.poster_path,
		backdrop_path: credit.backdrop_path,
		release_date: credit.release_date,
		vote_average: credit.vote_average,
		vote_count: 0,
		popularity: credit.popularity,
	};
}

/**
 * Converts a person's TV crew credit (directing, writing, music…) into a `MediaItem`.
 *
 * @param credit - TV crew credit from the TMDB person credits endpoint.
 * @returns Normalized `MediaItem` with `media_type: "tv"`.
 */
export function tvCrewCreditToMediaItem(credit: CrewTvCrewCredit): MediaItem {
	return {
		id: credit.id,
		media_type: 'tv',
		title: credit.name,
		original_title: credit.name,
		overview: credit.overview,
		poster_path: credit.poster_path,
		backdrop_path: credit.backdrop_path,
		release_date: credit.first_air_date,
		vote_average: credit.vote_average,
		vote_count: 0,
		popularity: credit.popularity,
	};
}

/**
 * Converts a playlist item into a minimal `MediaItem` for display in media grids.
 *
 * @param item - PlaylistItem from the database.
 * @returns Normalized `MediaItem` usable by `MediaCard` and related components.
 */
export function playlistItemToMediaItem(item: PlaylistItem): MediaItem {
	return {
		id: item.media_id,
		media_type: item.media_type,
		title: item.media_title,
		original_title: item.media_title,
		overview: '',
		poster_path: item.poster_path,
		backdrop_path: null,
		release_date: item.release_date ?? '',
		vote_average: 0,
		vote_count: 0,
		popularity: 0,
		genre_ids: item.genre_ids ?? undefined,
		addedAt: item.added_at,
	};
}
