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

export interface WatchmodeTitleResult {
  id: number;
  name: string;
  type: string;
  year: number;
}

export interface WatchmodeSearchResponse {
  title_results: WatchmodeTitleResult[];
}

/**
 * Fetches data from the Watchmode API with Next.js cache.
 * API key is injected as a query param (server-side only).
 *
 * @param path - API path including query string if needed.
 * @param revalidate - Cache TTL in seconds.
 */
export async function fetchWatchmode<T>(
  path: string,
  revalidate = 3600
): Promise<T> {
  if (!WATCHMODE_API_KEY) throw new Error('WATCHMODE_API_KEY is not defined');

  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${sep}apiKey=${WATCHMODE_API_KEY}`;

  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok)
    throw new Error(`Watchmode API Error: ${res.status} ${res.statusText}`);
  return res.json();
}
