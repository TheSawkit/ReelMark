import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { getServerLocale, getServerLanguage } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { Language } from '@/lib/i18n/translations';

export interface FetchTMDBOptions {
	revalidate?: number;
	retries?: number;
	lang?: Language;
}

const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_MAX_PAGE = 500;

const REGION_MERGE_CONFIG: Record<string, string[]> = {
	BE: ['BE', 'FR'],
};

function sanitizeTMDBEndpoint(endpoint: string): string {
	if (!endpoint.startsWith('/')) {
		throw new Error("TMDB endpoint must start with '/'.");
	}

	if (endpoint.startsWith('//') || endpoint.includes('://')) {
		throw new Error('TMDB endpoint must be a relative API path.');
	}

	if (endpoint.split('/').includes('..')) {
		throw new Error(
			'TMDB endpoint must not contain path traversal segments.'
		);
	}

	if (!/^\/[A-Za-z0-9._/-]*$/.test(endpoint)) {
		throw new Error('TMDB endpoint contains invalid characters.');
	}

	return endpoint;
}

export function clampPage(page: number): number {
	return Math.max(1, Math.min(page, TMDB_MAX_PAGE));
}

export function getMergeRegions(region: string): string[] | null {
	return REGION_MERGE_CONFIG[region] ?? null;
}

export async function getImageLanguageFilter(lang?: Language): Promise<string> {
	const resolved = lang ?? (await getServerLanguage());
	const languages = new Set(['null', resolved, 'en']);
	return Array.from(languages).join(',');
}

type TMDBResult<T> =
	{ ok: true; data: T } | { ok: false; status: number; statusText: string };

const TRANSIENT_FAILURE_CACHE = { stale: 0, revalidate: 60, expire: 300 };
const MISSING_ENTRY_CACHE = { stale: 0, revalidate: 3600, expire: 86400 };
const TMDB_TIMEOUT_MS = 10_000;

function retryDelay(attempt: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
}

/**
 * Cached TMDB call. **Never throws**: an exception crossing a `"use cache"` boundary
 * comes back digested, from the `Cache` environment, and takes down the surrounding
 * render even when the caller has a try/catch. HTTP failures (a 404 is routine — deleted
 * title, recommendations endpoint with no entry) AND network errors (timeout, DNS, reset)
 * are returned as data and turned back into an exception by `fetchTMDB`, outside the
 * cache scope. Dead 404s stay cached longer than transient failures.
 */
async function fetchTMDBUrl<T>(
	url: string,
	revalidate: number,
	retries: number
): Promise<TMDBResult<T>> {
	'use cache';
	cacheLife({ stale: 300, revalidate, expire: revalidate * 24 });

	for (let attempt = 0; ; attempt++) {
		let response: Response;
		try {
			response = await fetch(url, {
				headers: { Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}` },
				signal: AbortSignal.timeout(TMDB_TIMEOUT_MS),
			});
		} catch (error) {
			if (attempt < retries) {
				await retryDelay(attempt);
				continue;
			}
			cacheLife(TRANSIENT_FAILURE_CACHE);
			return {
				ok: false,
				status: 0,
				statusText:
					error instanceof Error ? error.name : 'NetworkError',
			};
		}

		if (response.ok)
			return { ok: true, data: (await response.json()) as T };

		const isRetryable = response.status === 429 || response.status >= 500;
		if (isRetryable && attempt < retries) {
			const retryAfter = Number(response.headers.get('retry-after'));
			if (retryAfter > 0) {
				await new Promise((resolve) =>
					setTimeout(resolve, retryAfter * 1000)
				);
			} else {
				await retryDelay(attempt);
			}
			continue;
		}

		// Lowest cacheLife wins, so a failure is not frozen for the success TTL.
		cacheLife(
			response.status === 404
				? MISSING_ENTRY_CACHE
				: TRANSIENT_FAILURE_CACHE
		);
		return {
			ok: false,
			status: response.status,
			statusText: response.statusText,
		};
	}
}

/**
 * Fetches from TMDB with Bearer auth, locale injection, and a prerenderable `"use cache"` entry.
 * Pass `lang` from the route params on localized pages: omitting it resolves the language
 * from the request, which makes the caller dynamic.
 */
export async function fetchTMDB<T>(
	endpoint: string,
	params: Record<string, string> = {},
	{ revalidate = 3600, retries = 2, lang }: FetchTMDBOptions = {}
): Promise<T> {
	if (!TMDB_READ_ACCESS_TOKEN) {
		throw new Error('TMDB_READ_ACCESS_TOKEN is not defined.');
	}

	const safeEndpoint = sanitizeTMDBEndpoint(endpoint);
	const locale = await getServerLocale(lang);

	const queryParams = new URLSearchParams({ language: locale, ...params });

	const url = `${TMDB_BASE_URL}${safeEndpoint}?${queryParams.toString()}`;

	const result = await fetchTMDBUrl<T>(url, revalidate, retries);
	if (!result.ok) {
		throw new Error(
			`TMDB API Error: ${result.status} ${result.statusText}`
		);
	}
	return result.data;
}

/** Resolves the user's region from profile metadata, falling back to locale country or "US". Deduped per request. */
export const getUserRegion = cache(async (lang?: Language): Promise<string> => {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (user?.user_metadata?.region) {
			return user.user_metadata.region.toUpperCase();
		}
	} catch {
		/* unauthenticated */
	}

	const locale = await getServerLocale(lang);
	if (locale.includes('-')) {
		return locale.split('-')[1].toUpperCase();
	}

	return 'US';
});
