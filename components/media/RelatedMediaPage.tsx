import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { MediaGrid } from '@/components/media/card/MediaGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { mergeWithWatchlist } from '@/lib/data/watchlist';
import type { MediaItem } from '@/types/tmdb';

interface RelatedMediaPageProps {
	title: string;
	subtitle?: string;
	items: MediaItem[];
	emptyLabel: string;
}

/** Full-page grid for saga and similar-titles listings, with watchlist badges. */
export async function RelatedMediaPage({
	title,
	subtitle,
	items,
	emptyLabel,
}: RelatedMediaPageProps) {
	const withPosters = items.filter((item) => item.poster_path !== null);
	const merged = await mergeWithWatchlist(withPosters);

	return (
		<PageLayout className="screen-in">
			<PageHeader title={title} subtitle={subtitle} />
			{merged.length === 0 ? (
				<EmptyState message={emptyLabel} />
			) : (
				<MediaGrid items={merged} />
			)}
		</PageLayout>
	);
}
