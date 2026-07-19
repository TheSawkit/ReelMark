import { fetchTMDB } from '@/lib/tmdb/client';
import { searchMulti } from '@/lib/tmdb/search';
import { reportCritical, reportSwallowed } from '@/lib/report';
import { VALID_MEDIA_TYPES } from '@/lib/validators';
import type { ImportItem, ImportMatch } from './types';

interface TmdbVerified {
	type: 'movie' | 'tv';
	title: string;
	poster_path: string | null;
}

interface FindResult {
	id: number;
	title: string;
	poster_path: string | null;
}

export const RESOLVE_CONCURRENCY = 6;

/** Runs `fn` over `arr` with at most `limit` promises in flight, preserving order. */
export async function mapLimit<T, R>(
	arr: T[],
	limit: number,
	fn: (item: T) => Promise<R>
): Promise<R[]> {
	const out = new Array<R>(arr.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(limit, arr.length) }, async () => {
			for (;;) {
				const i = next++;
				if (i >= arr.length) return;
				out[i] = await fn(arr[i]);
			}
		})
	);
	return out;
}

async function fetchTmdbForType(
	id: number,
	type: 'movie' | 'tv'
): Promise<TmdbVerified | null> {
	try {
		if (type === 'movie') {
			const data = await fetchTMDB<{
				title: string;
				poster_path: string | null;
			}>(`/movie/${id}`, {}, { revalidate: 86400 });
			return {
				type: 'movie',
				title: data.title,
				poster_path: data.poster_path,
			};
		}
		const data = await fetchTMDB<{
			name: string;
			poster_path: string | null;
		}>(`/tv/${id}`, {}, { revalidate: 86400 });
		return { type: 'tv', title: data.name, poster_path: data.poster_path };
	} catch (error) {
		if (error instanceof Error && error.message.includes('404'))
			return null;
		throw error;
	}
}

async function verifyTmdbType(
	id: number,
	expected: 'movie' | 'tv'
): Promise<TmdbVerified | null> {
	const primary = await fetchTmdbForType(id, expected);
	if (primary) return primary;
	return fetchTmdbForType(id, expected === 'movie' ? 'tv' : 'movie');
}

async function findByImdbId(
	imdbId: string,
	expectedType: 'movie' | 'tv'
): Promise<FindResult | null> {
	try {
		const data = await fetchTMDB<{
			movie_results: Array<{
				id: number;
				title: string;
				poster_path: string | null;
			}>;
			tv_results: Array<{
				id: number;
				name: string;
				poster_path: string | null;
			}>;
		}>(
			`/find/${imdbId}`,
			{ external_source: 'imdb_id' },
			{ revalidate: 86400 }
		);

		if (expectedType === 'movie') {
			const r = data.movie_results[0];
			return r
				? { id: r.id, title: r.title, poster_path: r.poster_path }
				: null;
		}
		const r = data.tv_results[0];
		return r
			? { id: r.id, title: r.name, poster_path: r.poster_path }
			: null;
	} catch (error) {
		reportCritical('data-import:find-imdb', error);
		return null;
	}
}

async function findByTvdbId(tvdbId: number): Promise<FindResult | null> {
	try {
		const data = await fetchTMDB<{
			tv_results: Array<{
				id: number;
				name: string;
				poster_path: string | null;
			}>;
		}>(
			`/find/${tvdbId}`,
			{ external_source: 'tvdb_id' },
			{ revalidate: 86400 }
		);

		const r = data.tv_results[0];
		return r
			? { id: r.id, title: r.name, poster_path: r.poster_path }
			: null;
	} catch (error) {
		reportCritical('data-import:find-tvdb', error);
		return null;
	}
}

const isPositiveId = (value: number | null | undefined): value is number =>
	typeof value === 'number' && Number.isInteger(value) && value > 0;

/** Trusts the file's TMDB id, keeping the entry even when TMDB is unreachable. */
async function matchByTmdbId(
	tmdbId: number,
	mediaType: 'movie' | 'tv',
	fallbackTitle: string,
	fallbackPoster: string | null
): Promise<ImportMatch | null> {
	try {
		const verified = await verifyTmdbType(tmdbId, mediaType);
		if (!verified) return null;
		return {
			id: tmdbId,
			type: verified.type,
			title: verified.title || fallbackTitle,
			poster_path: verified.poster_path,
		};
	} catch (error) {
		reportSwallowed('data-import:verify-tmdb', error);
		return {
			id: tmdbId,
			type: mediaType,
			title: fallbackTitle,
			poster_path: fallbackPoster,
		};
	}
}

async function matchByExternalId(
	item: ImportItem,
	mediaType: 'movie' | 'tv'
): Promise<ImportMatch | null> {
	if (item.imdbId && /^tt\d+$/.test(item.imdbId)) {
		const found = await findByImdbId(item.imdbId, mediaType);
		if (found) return { ...found, type: mediaType };
	}

	if (isPositiveId(item.tvdbId)) {
		const found = await findByTvdbId(item.tvdbId);
		if (found) return { ...found, type: 'tv' };
	}

	return null;
}

/** Last resort: title search, preferring a release year match when the file carries one. */
async function matchByTitle(
	item: ImportItem,
	fallbackTitle: string
): Promise<ImportMatch | null> {
	const results = await searchMulti(String(item.title).slice(0, 200));
	const candidates = item.mediaType
		? results.filter((r) => r.media_type === item.mediaType)
		: results;
	const match = item.year
		? (candidates.find((r) =>
				r.release_date?.startsWith(String(item.year))
			) ?? candidates[0])
		: candidates[0];

	if (!match) return null;
	return {
		id: match.id,
		type: match.media_type as 'movie' | 'tv',
		title: match.title || fallbackTitle,
		poster_path: match.poster_path,
	};
}

/**
 * Resolves one imported row to a TMDB entry, trying the most trustworthy source first.
 * A TMDB id is authoritative: when it fails verification the row is dropped rather than guessed.
 */
export async function resolveImportMedia(
	item: ImportItem
): Promise<ImportMatch | null> {
	const mediaType: 'movie' | 'tv' =
		item.mediaType && VALID_MEDIA_TYPES.has(item.mediaType)
			? item.mediaType
			: 'movie';
	const fallbackTitle = String(item.title).slice(0, 500);

	if (isPositiveId(item.tmdbId)) {
		return matchByTmdbId(
			item.tmdbId,
			mediaType,
			fallbackTitle,
			item.posterPath ?? null
		);
	}

	return (
		(await matchByExternalId(item, mediaType)) ??
		(await matchByTitle(item, fallbackTitle))
	);
}
