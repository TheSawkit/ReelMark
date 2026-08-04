import { isTMDBNotFound } from '@/lib/tmdb/errors';
import type {
	Credits,
	MediaImagesResponse,
	MediaType,
	Video,
	VideoResponse,
	WatchProvidersRegion,
	WatchProvidersResponse,
} from '@/types/tmdb';
import {
	fetchTMDB,
	getUserRegion,
	clampPage,
	getImageLanguageFilter,
	REVALIDATE,
} from './client';
import { getWatchmodeProviders } from '@/lib/watchmode/providers';
import { reportSwallowed } from '@/lib/report';
import type { Language } from '@/lib/i18n/translations';

const REPORT_SCOPE: Record<MediaType, string> = {
	movie: 'tmdb/movies',
	tv: 'tmdb/tv',
};

/** @returns One page of a TMDB list endpoint, clamped to the API's page ceiling. */
export async function fetchMediaPage<T>(
	endpoint: string,
	page: number,
	lang?: Language
): Promise<T[]> {
	const { results } = await fetchTMDB<{ results: T[] }>(
		endpoint,
		{ page: clampPage(page).toString() },
		{ lang }
	);
	return results;
}

/** @returns Full details for a movie or TV show, cached for a day. */
export async function fetchMediaDetails<T>(
	mediaType: MediaType,
	id: number,
	lang?: Language
): Promise<T> {
	return fetchTMDB<T>(
		`/${mediaType}/${id}`,
		{},
		{ revalidate: REVALIDATE.day, lang }
	);
}

/** @returns Cast and crew credits for the given title. */
export async function fetchMediaCredits(
	mediaType: MediaType,
	id: number,
	lang?: Language
): Promise<Credits> {
	return fetchTMDB<Credits>(
		`/${mediaType}/${id}/credits`,
		{},
		{ revalidate: REVALIDATE.day, lang }
	);
}

/** @returns Official video trailers and clips for the given title. */
export async function fetchMediaVideos(
	mediaType: MediaType,
	id: number,
	lang?: Language
): Promise<Video[]> {
	const { results } = await fetchTMDB<VideoResponse>(
		`/${mediaType}/${id}/videos`,
		{},
		{ revalidate: REVALIDATE.day, lang }
	);
	return results;
}

/** @returns Available backdrop and poster images for the given title. */
export async function fetchMediaImages(
	mediaType: MediaType,
	id: number,
	lang?: Language
): Promise<MediaImagesResponse> {
	const imageLanguage = await getImageLanguageFilter(lang);
	return fetchTMDB<MediaImagesResponse>(
		`/${mediaType}/${id}/images`,
		{ include_image_language: imageLanguage },
		{ revalidate: REVALIDATE.day, lang }
	);
}

/**
 * Fetches a TMDB relation feed (recommendations or similar titles).
 * Returns an empty array on failure — a missing entry is routine for these endpoints.
 */
export async function fetchRelatedMedia<T>(
	mediaType: MediaType,
	relation: 'recommendations' | 'similar',
	id: number,
	lang?: Language,
	page = 1
): Promise<T[]> {
	try {
		const { results } = await fetchTMDB<{ results: T[] }>(
			`/${mediaType}/${id}/${relation}`,
			{ page: String(page) },
			{ revalidate: REVALIDATE.day, lang }
		);
		return results;
	} catch (error) {
		if (!isTMDBNotFound(error))
			reportSwallowed(`${REPORT_SCOPE[mediaType]}:${relation}`, error);
		return [];
	}
}

/**
 * Returns watch providers for the viewer's region, preferring Watchmode's catalogue
 * over TMDB's when it has entries. Returns null when neither source covers the region.
 */
export async function fetchWatchProviders(
	mediaType: MediaType,
	id: number,
	lang?: Language
): Promise<WatchProvidersRegion | null> {
	try {
		const [tmdbData, region] = await Promise.all([
			fetchTMDB<WatchProvidersResponse>(
				`/${mediaType}/${id}/watch/providers`,
				{},
				{ revalidate: REVALIDATE.halfDay, lang }
			),
			getUserRegion(lang),
		]);
		const watchmode = await getWatchmodeProviders(id, mediaType, region);
		const tmdb = tmdbData.results[region] ?? null;

		if (watchmode) {
			return {
				link: tmdb?.link ?? '',
				flatrate: watchmode.streaming.length
					? watchmode.streaming
					: tmdb?.flatrate,
				rent: watchmode.rent.length ? watchmode.rent : tmdb?.rent,
				buy: watchmode.buy.length ? watchmode.buy : tmdb?.buy,
			};
		}

		return tmdb;
	} catch (error) {
		reportSwallowed(`${REPORT_SCOPE[mediaType]}:watch-providers`, error);
		return null;
	}
}
