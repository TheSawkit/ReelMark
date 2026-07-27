import { WatchNowSeed } from '@/components/media/detail/WatchNowSeed';
import { getCachedStreamingProviders } from '@/lib/data/watchlist';
import { getAvailableProviders } from '@/lib/tmdb/providers';
import { matchMyProviders } from '@/lib/watch-now';
import type { WatchProvidersRegion } from '@/types/tmdb';

interface WatchNowPublisherProps {
	providers: WatchProvidersRegion | null;
	region: string;
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

	const myProviderIds = await getCachedStreamingProviders();
	if (myProviderIds.length === 0) return null;

	const available = await getAvailableProviders(region);
	const mine = new Set(myProviderIds);

	const options = matchMyProviders(
		providers.flatrate,
		available.filter((provider) => mine.has(provider.provider_id)),
		providers.link
	);
	if (options.length === 0) return null;

	return <WatchNowSeed options={options} />;
}
