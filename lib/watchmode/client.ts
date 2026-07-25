import { monotonicNowMs } from '@/lib/monotonic-now';

const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY;
const BASE_URL = 'https://api.watchmode.com/v1';

export interface WatchmodeSourceListing {
	id: number;
	name: string;
	type: string;
	logo_100px: string;
	regions: string[];
}

export interface WatchmodeTitleSource {
	source_id: number;
	name: string;
	type: 'sub' | 'rent' | 'buy' | 'free' | 'tve' | 'utv';
	region: string;
	web_url: string;
	format: string;
	price: number | null;
}

interface WatchmodeTitleResult {
	id: number;
	name: string;
	type: string;
	year: number;
}

export interface WatchmodeSearchResponse {
	title_results: WatchmodeTitleResult[];
}

export interface WatchmodeRegion {
	country: string;
	name: string;
	plan_enabled: boolean;
}

const WATCHMODE_TIMEOUT_MS = 8_000;
const QUOTA_COOLDOWN_MS = 5 * 60_000;
const QUOTA_STATUSES = new Set([401, 402, 429]);

let quotaCooldownUntil = 0;

/**
 * Fetches data from the Watchmode API with Next.js cache.
 * API key is injected as a query param (server-side only).
 * A quota/rate-limit response (401/402/429) opens a 5 min cooldown during which every
 * call fails fast without spending a request — the monthly quota is small.
 *
 * @param path - API path including query string if needed.
 * @param revalidate - Cache TTL in seconds.
 */
export async function fetchWatchmode<T>(
	path: string,
	revalidate = 3600
): Promise<T> {
	if (!WATCHMODE_API_KEY) throw new Error('WATCHMODE_API_KEY is not defined');

	if (monotonicNowMs() < quotaCooldownUntil) {
		throw new Error('Watchmode API Error: quota cooldown active');
	}

	const sep = path.includes('?') ? '&' : '?';
	const url = `${BASE_URL}${path}${sep}apiKey=${WATCHMODE_API_KEY}`;

	const res = await fetch(url, {
		next: { revalidate },
		signal: AbortSignal.timeout(WATCHMODE_TIMEOUT_MS),
	});

	if (QUOTA_STATUSES.has(res.status)) {
		quotaCooldownUntil = monotonicNowMs() + QUOTA_COOLDOWN_MS;
	}

	if (!res.ok)
		throw new Error(`Watchmode API Error: ${res.status} ${res.statusText}`);
	return res.json();
}
