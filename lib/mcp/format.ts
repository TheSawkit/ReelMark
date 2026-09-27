import type { UserMark } from '@/lib/data/taste';
import type { RatedEntry, TasteSummary } from '@/lib/recommendations';
import type {
	MediaItem,
	MediaType,
	MovieDetails,
	RecommendationSource,
	TasteEntry,
	TvShowDetails,
	WatchProvider,
	WatchProvidersRegion,
	WatchStatus,
} from '@/types/tmdb';

const OVERVIEW_MAX = 280;

/** What every formatter needs: genre names by TMDB id, and the ReelMark page of a title. */
export interface AssistantFormat {
	genres: Readonly<Record<number, string>>;
	link: (type: MediaType, id: number) => string;
}

export interface AssistantTitle {
	id: number;
	type: MediaType;
	title: string;
	year: string | null;
	genres: string[];
	tmdbRating: number | null;
	url: string;
	overview?: string;
	because?: RecommendationSource;
	status?: WatchStatus;
	myRating?: number;
}

export interface AssistantEntry {
	id: number;
	type: MediaType;
	title: string;
	year: string | null;
	genres: string[];
	status: WatchStatus;
	addedAt: string;
	url: string;
	myRating?: number;
}

const yearOf = (date: string | null | undefined) => date?.slice(0, 4) || null;

const roundRating = (value: number | null | undefined) =>
	value ? Math.round(value * 10) / 10 : null;

const namesOf = (
	ids: readonly number[],
	genres: AssistantFormat['genres']
): string[] => ids.flatMap((id) => (genres[id] ? [genres[id]] : []));

const providerNames = (providers: WatchProvider[] | undefined) =>
	(providers ?? []).map(({ provider_name }) => provider_name);

function shorten(text: string): string | undefined {
	if (!text) return undefined;
	return text.length > OVERVIEW_MAX
		? `${text.slice(0, OVERVIEW_MAX - 1).trimEnd()}…`
		: text;
}

/** A TMDB title as an assistant reads it: compact, genre names instead of ids, and the user's own mark when known. */
export function toAssistantTitle(
	item: MediaItem,
	format: AssistantFormat,
	mark?: UserMark
): AssistantTitle {
	return {
		id: item.id,
		type: item.media_type,
		title: item.title,
		year: yearOf(item.release_date),
		genres: namesOf(item.genre_ids ?? [], format.genres),
		tmdbRating: roundRating(item.vote_average),
		url: format.link(item.media_type, item.id),
		overview: shorten(item.overview),
		because: item.becauseOf,
		status: mark?.status,
		myRating: mark?.rating,
	};
}

/** One title of the user's library, with their rating when they gave one. */
export function toAssistantEntry(
	entry: TasteEntry,
	format: AssistantFormat,
	rating?: number
): AssistantEntry {
	return {
		id: entry.media_id,
		type: entry.media_type,
		title: entry.media_title,
		year: yearOf(entry.release_date),
		genres: namesOf(entry.genre_ids ?? [], format.genres),
		status: entry.status,
		addedAt: entry.created_at,
		url: format.link(entry.media_type, entry.media_id),
		myRating: rating,
	};
}

/** The taste summary of one media type, spelled out for an assistant — ratings are on ReelMark's 1–10 scale. */
export function toAssistantTaste(
	summary: TasteSummary,
	format: AssistantFormat
) {
	const rated = ({ entry, rating }: RatedEntry) =>
		toAssistantEntry(entry, format, rating);
	const listed = (entry: TasteEntry) => toAssistantEntry(entry, format);

	return {
		favoriteGenres: namesOf(summary.favoriteGenreIds, format.genres),
		dislikedGenres: namesOf(summary.dislikedGenreIds, format.genres),
		averageRating: roundRating(summary.meanRating),
		counts: summary.counts,
		lovedMost: summary.topRated.map(rated),
		dislikedMost: summary.lowRated.map(rated),
		watchingNow: summary.watching.map(listed),
		abandoned: summary.abandoned.map(listed),
	};
}

/** Full details of one title, where to stream it in the user's region, and the user's own mark. */
export function toAssistantDetails(
	details: MovieDetails | TvShowDetails,
	type: MediaType,
	providers: WatchProvidersRegion | null,
	format: AssistantFormat,
	mark?: UserMark
) {
	const common = {
		id: details.id,
		type,
		genres: details.genres.map(({ name }) => name),
		tmdbRating: roundRating(details.vote_average),
		overview: details.overview || undefined,
		tagline: details.tagline || undefined,
		streaming: providerNames(providers?.flatrate),
		rent: providerNames(providers?.rent),
		buy: providerNames(providers?.buy),
		url: format.link(type, details.id),
		status: mark?.status,
		myRating: mark?.rating,
	};

	if ('title' in details) {
		return {
			...common,
			title: details.title,
			year: yearOf(details.release_date),
			runtimeMinutes: details.runtime || undefined,
		};
	}
	return {
		...common,
		title: details.name,
		year: yearOf(details.first_air_date),
		seasons: details.number_of_seasons,
		episodes: details.number_of_episodes,
		showStatus: details.status,
		createdBy: details.created_by.map(({ name }) => name),
	};
}
