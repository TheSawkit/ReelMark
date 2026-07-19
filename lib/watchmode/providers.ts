import type { WatchProvider } from '@/types/tmdb';
import { fetchWatchmode } from './client';
import { reportSwallowed } from '@/lib/report';
import type {
	WatchmodeSearchResponse,
	WatchmodeTitleSource,
	WatchmodeSourceListing,
} from './client';

const REGION_FALLBACKS: Record<string, string[]> = {};

export interface WatchmodeProviderResult {
	streaming: WatchProvider[];
	rent: WatchProvider[];
	buy: WatchProvider[];
}

async function getSourceListings(): Promise<
	Map<number, WatchmodeSourceListing>
> {
	try {
		const listings = await fetchWatchmode<WatchmodeSourceListing[]>(
			'/sources/',
			604800
		);
		return new Map(listings.map((s) => [s.id, s]));
	} catch (error) {
		reportSwallowed('watchmode:sources', error);
		return new Map();
	}
}

async function resolveTmdbId(
	tmdbId: number,
	mediaType: 'movie' | 'tv'
): Promise<number | null> {
	try {
		const field = mediaType === 'movie' ? 'tmdb_movie_id' : 'tmdb_tv_id';
		const types = mediaType === 'movie' ? 'movie' : 'tv_series';
		const data = await fetchWatchmode<WatchmodeSearchResponse>(
			`/search/?search_field=${field}&search_value=${tmdbId}&types=${types}`,
			172800
		);
		return data.title_results[0]?.id ?? null;
	} catch (error) {
		reportSwallowed('watchmode:resolve-id', error);
		return null;
	}
}

function toWatchProvider(
	s: WatchmodeTitleSource,
	priority: number,
	logoMap: Map<number, WatchmodeSourceListing>
): WatchProvider {
	return {
		provider_id: s.source_id,
		provider_name: s.name,
		logo_path: '',
		logo_url: logoMap.get(s.source_id)?.logo_100px,
		display_priority: priority,
		web_url: s.web_url,
		price: s.price,
	};
}

/**
 * Returns streaming, rent, and buy providers for a title via Watchmode.
 * Includes prices and direct content URLs per provider.
 * Uses the exact region provided — no fallbacks applied.
 *
 * @param tmdbId - TMDB movie or TV show ID.
 * @param mediaType - "movie" or "tv".
 * @param region - ISO 3166-1 alpha-2 region code.
 */
export async function getWatchmodeProviders(
	tmdbId: number,
	mediaType: 'movie' | 'tv',
	region: string
): Promise<WatchmodeProviderResult | null> {
	try {
		const watchmodeId = await resolveTmdbId(tmdbId, mediaType);
		if (!watchmodeId) return null;

		const regions = [region, ...(REGION_FALLBACKS[region] ?? [])].filter(
			(r, i, arr) => arr.indexOf(r) === i
		);
		const regionsParam = regions.join(',');

		const [sources, logoMap] = await Promise.all([
			fetchWatchmode<WatchmodeTitleSource[]>(
				`/title/${watchmodeId}/sources/?regions=${regionsParam}`,
				172800
			),
			getSourceListings(),
		]);

		type BillingType = 'sub' | 'rent' | 'buy';

		function isBillingType(type: string): type is BillingType {
			return type === 'sub' || type === 'rent' || type === 'buy';
		}

		const best: Record<BillingType, Map<string, WatchmodeTitleSource>> = {
			sub: new Map(),
			rent: new Map(),
			buy: new Map(),
		};

		for (const r of regions) {
			for (const s of sources.filter((src) => src.region === r)) {
				if (!isBillingType(s.type)) continue;
				const t = s.type;
				const existing = best[t].get(s.name);
				if (
					!existing ||
					(s.price != null &&
						(existing.price == null || s.price < existing.price))
				) {
					best[t].set(s.name, s);
				}
			}
		}

		const result: WatchmodeProviderResult = {
			streaming: Array.from(best.sub.values()).map((s, i) =>
				toWatchProvider(s, i, logoMap)
			),
			rent: Array.from(best.rent.values()).map((s, i) =>
				toWatchProvider(s, i, logoMap)
			),
			buy: Array.from(best.buy.values()).map((s, i) =>
				toWatchProvider(s, i, logoMap)
			),
		};

		const hasData =
			result.streaming.length > 0 ||
			result.rent.length > 0 ||
			result.buy.length > 0;
		return hasData ? result : null;
	} catch (error) {
		reportSwallowed('watchmode:title-sources', error);
		return null;
	}
}
