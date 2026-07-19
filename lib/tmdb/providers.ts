import { fetchTMDB } from './client';
import type {
	MediaType,
	WatchProvider,
	WatchProvidersResponse,
} from '@/types/tmdb';
import type { Language } from '@/lib/i18n/translations';
import { reportSwallowed } from '@/lib/report';

const PROVIDER_LIST_SIZE = 40;

interface ProviderListEntry {
	provider_id: number;
	provider_name: string;
	logo_path: string;
	display_priorities?: Record<string, number>;
	display_priority: number;
}

/**
 * Returns the streaming providers available in a region (movies + TV merged),
 * sorted by regional display priority — the source of the settings picker.
 */
export async function getAvailableProviders(
	region: string,
	lang?: Language
): Promise<WatchProvider[]> {
	try {
		const [movies, tv] = await Promise.all([
			fetchTMDB<{ results: ProviderListEntry[] }>(
				'/watch/providers/movie',
				{ watch_region: region },
				{ revalidate: 604800, lang }
			),
			fetchTMDB<{ results: ProviderListEntry[] }>(
				'/watch/providers/tv',
				{ watch_region: region },
				{ revalidate: 604800, lang }
			),
		]);

		const byId = new Map<number, ProviderListEntry>();
		for (const entry of [...movies.results, ...tv.results]) {
			if (!byId.has(entry.provider_id))
				byId.set(entry.provider_id, entry);
		}

		return [...byId.values()]
			.map((entry) => ({
				provider_id: entry.provider_id,
				provider_name: entry.provider_name,
				logo_path: entry.logo_path,
				display_priority:
					entry.display_priorities?.[region] ??
					entry.display_priority,
			}))
			.sort((a, b) => a.display_priority - b.display_priority)
			.slice(0, PROVIDER_LIST_SIZE);
	} catch (error) {
		reportSwallowed('tmdb/providers:available', error);
		return [];
	}
}

/**
 * Returns the flatrate (subscription) provider IDs of a title in a region.
 * TMDB-only on purpose — cheap and shared across users, unlike the
 * Watchmode-enriched detail-page lookup.
 */
export async function getFlatrateProviderIds(
	mediaType: MediaType,
	id: number,
	region: string,
	lang?: Language
): Promise<number[]> {
	try {
		const data = await fetchTMDB<WatchProvidersResponse>(
			`/${mediaType}/${id}/watch/providers`,
			{},
			{ revalidate: 43200, lang }
		);
		return (data.results[region]?.flatrate ?? []).map(
			(provider) => provider.provider_id
		);
	} catch (error) {
		reportSwallowed('tmdb/providers:flatrate', error);
		return [];
	}
}
