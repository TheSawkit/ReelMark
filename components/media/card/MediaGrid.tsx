import { MediaCard } from '@/components/media/card/MediaCard';
import { StaggeredItem } from '@/components/ui/StaggeredItem';
import { getMediaKey } from '@/lib/media';
import { MEDIA_GRID } from '@/components/media/card/grid';
import type { MediaGridProps } from '@/types/components';

export function MediaGrid({
	items,
	hideRating,
	showWatchlistMeta,
}: MediaGridProps) {
	return (
		<div className={MEDIA_GRID.className}>
			{items.map((media, index) => (
				<div key={getMediaKey(media)} className="media-grid-cell">
					<StaggeredItem index={index}>
						<MediaCard
							media={media}
							watchlistEntry={
								showWatchlistMeta
									? media.watchlistEntry
									: undefined
							}
							hideRating={hideRating}
							imageSize="grid"
							priority={index < 6}
						/>
					</StaggeredItem>
				</div>
			))}
		</div>
	);
}
