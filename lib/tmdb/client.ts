import { cache } from 'react';
import { getServerLocale, getServerLanguage } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';

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

export async function getImageLanguageFilter(): Promise<string> {
	const lang = await getServerLanguage();
	const languages = new Set(['null', lang, 'en']);
	return Array.from(languages).join(',');
}

/** Fetches from TMDB with Bearer auth, locale injection, and Next.js cache revalidation. */
export async function fetchTMDB<T>(
	endpoint: string,
	params: Record<string, string> = {},
	revalidate = 3600,
	retries = 2
): Promise<T> {
	if (!TMDB_READ_ACCESS_TOKEN) {
		throw new Error('TMDB_READ_ACCESS_TOKEN is not defined.');
	}

	const safeEndpoint = sanitizeTMDBEndpoint(endpoint);
	const locale = await getServerLocale();

	const queryParams = new URLSearchParams({ language: locale, ...params });

	const url = `${TMDB_BASE_URL}${safeEndpoint}?${queryParams.toString()}`;

	for (let attempt = 0; ; attempt++) {
		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}` },
			next: { revalidate },
		});

		if (response.ok) return response.json();

		if (response.status === 429 && attempt < retries) {
			const retryAfter = Number(response.headers.get('retry-after'));
			const delayMs =
				retryAfter > 0 ? retryAfter * 1000 : 300 * (attempt + 1);
			await new Promise((resolve) => setTimeout(resolve, delayMs));
			continue;
		}

		throw new Error(
			`TMDB API Error: ${response.status} ${response.statusText}`
		);
	}
}

/** Resolves the user's region from profile metadata, falling back to locale country or "US". Deduped per request. */
export const getUserRegion = cache(async (): Promise<string> => {
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

	const locale = await getServerLocale();
	if (locale.includes('-')) {
		return locale.split('-')[1].toUpperCase();
	}

	return 'US';
});
