import { fetchTMDB } from './client';
import { normalizeName, providerAlias } from '@/lib/provider-identity';
import type { Language } from '@/lib/i18n/translations';
import { reportSwallowed } from '@/lib/report';

export { normalizeName } from '@/lib/provider-identity';

interface TmdbProviderItem {
	logo_path: string;
	provider_id: number;
	provider_name: string;
}

async function fetchProviderList(
	mediaType: 'movie' | 'tv',
	region: string,
	lang?: Language
): Promise<TmdbProviderItem[]> {
	try {
		const data = await fetchTMDB<{ results: TmdbProviderItem[] }>(
			`/watch/providers/${mediaType}`,
			{ watch_region: region },
			{ revalidate: 604800, lang }
		);
		return data.results ?? [];
	} catch (error) {
		reportSwallowed('tmdb/watch-providers:list', error);
		return [];
	}
}

/**
 * Fetches movie + TV providers for US and BE regions to build a comprehensive
 * name → logo_path map. US covers most global providers, BE covers European ones.
 * Cached 1 week.
 */
export async function getTmdbProviderLogoMap(
	lang?: Language
): Promise<Map<string, string>> {
	try {
		const [movieFR, tvFR, movieNL, movieUS] = await Promise.all([
			fetchProviderList('movie', 'FR', lang),
			fetchProviderList('tv', 'FR', lang),
			fetchProviderList('movie', 'NL', lang),
			fetchProviderList('movie', 'US', lang),
		]);

		const map = new Map<string, string>();
		for (const p of [...movieFR, ...tvFR, ...movieNL, ...movieUS]) {
			const key = normalizeName(p.provider_name);
			if (!map.has(key)) map.set(key, p.logo_path);
		}
		return map;
	} catch (error) {
		reportSwallowed('tmdb/watch-providers:logo-map', error);
		return new Map();
	}
}

export function resolveProviderLogo(
	providerName: string,
	logoMap: Map<string, string>,
	fallbackLogoUrl?: string,
	fallbackLogoPath?: string
): string | null {
	const key = normalizeName(providerName);

	const exact = logoMap.get(key);
	if (exact) return `https://image.tmdb.org/t/p/w92${exact}`;

	const alias = providerAlias(key);
	if (alias) {
		const aliased = logoMap.get(alias);
		if (aliased) return `https://image.tmdb.org/t/p/w92${aliased}`;
	}

	if (key.length >= 5) {
		for (const [tmdbKey, path] of logoMap) {
			if (tmdbKey.startsWith(key)) {
				return `https://image.tmdb.org/t/p/w92${path}`;
			}
		}
	}

	if (fallbackLogoUrl) return fallbackLogoUrl;
	if (fallbackLogoPath)
		return `https://image.tmdb.org/t/p/w92${fallbackLogoPath}`;
	return null;
}
