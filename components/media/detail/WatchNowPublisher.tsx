import { WatchNowSeed } from '@/components/media/detail/WatchNowSeed';
import { getCachedStreamingProviders } from '@/lib/data/watchlist';
import { getAvailableProviders } from '@/lib/tmdb/providers';
import { reportSwallowed } from '@/lib/report';
import { matchMyProviders, type WatchNowOption } from '@/lib/watch-now';
import type { WatchProvidersRegion } from '@/types/tmdb';

interface WatchNowPublisherProps {
	providers: WatchProvidersRegion | null;
	region: string;
}

/**
 * Hosting the play options inside "where to watch" must never make that section depend on the
 * session being readable, so a failure here degrades to no play button instead of no section.
 */
async function resolveMyOptions(
	providers: WatchProvidersRegion,
	region: string
): Promise<WatchNowOption[]> {
	try {
		const myProviderIds = await getCachedStreamingProviders();
		if (myProviderIds.length === 0) return [];

		const available = await getAvailableProviders(region);
		const mine = new Set(myProviderIds);

		return matchMyProviders(
			providers.flatrate,
			available.filter((provider) => mine.has(provider.provider_id)),
			providers.link
		);
	} catch (error) {
		reportSwallowed('watch-now:publisher', error);
		return [];
	}
}

/**
 * Resolves which of the user's own services carry this title and hands them to the play
 * controls. Lives inside the "where to watch" section so the offers are fetched once, and so
 * no extra streaming boundary is opened in the banner or the sticky bar.
 */
export async function WatchNowPublisher({
	providers,
	region,
}: WatchNowPublisherProps) {
	if (!providers?.flatrate?.length) return null;

	const options = await resolveMyOptions(providers, region);
	if (options.length === 0) return null;

	return <WatchNowSeed options={options} />;
}
