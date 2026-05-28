import { fetchTMDB } from './client';

interface TmdbProviderItem {
	logo_path: string;
	provider_id: number;
	provider_name: string;
}

const NAME_ALIASES: Record<string, string> = {
	amazon: 'amazonprimevideo',
	amazonprime: 'amazonprimevideo',
	hbomax: 'max',
	hbo: 'max',
	paramountplus: 'paramountplus',
	paramount: 'paramountplus',
	peacockpremium: 'peacockpremium',
	peacock: 'peacockpremium',
	nowtv: 'nowtv',
	now: 'nowtv',
	disney: 'disneyplus',
	disneyplus: 'disneyplus',
};

export function normalizeName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchProviderList(
	mediaType: 'movie' | 'tv',
	region: string
): Promise<TmdbProviderItem[]> {
	try {
		const data = await fetchTMDB<{ results: TmdbProviderItem[] }>(
			`/watch/providers/${mediaType}`,
			{ watch_region: region },
			604800
		);
		return data.results ?? [];
	} catch {
		return [];
	}
}

/**
 * Fetches movie + TV providers for US and BE regions to build a comprehensive
 * name → logo_path map. US covers most global providers, BE covers European ones.
 * Cached 1 week.
 */
export async function getTmdbProviderLogoMap(): Promise<Map<string, string>> {
	try {
		const [movieFR, tvFR, movieNL, movieUS] = await Promise.all([
			fetchProviderList('movie', 'FR'),
			fetchProviderList('tv', 'FR'),
			fetchProviderList('movie', 'NL'),
			fetchProviderList('movie', 'US'),
		]);

		const map = new Map<string, string>();
		for (const p of [...movieFR, ...tvFR, ...movieNL, ...movieUS]) {
			const key = normalizeName(p.provider_name);
			if (!map.has(key)) map.set(key, p.logo_path);
		}
		return map;
	} catch (e) {
		console.error('[WatchProviders] getTmdbProviderLogoMap failed:', e);
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

	const alias = NAME_ALIASES[key];
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
