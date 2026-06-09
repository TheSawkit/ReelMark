import { MediaCard } from '@/components/media/card/MediaCard';
import { StaggeredItem } from '@/components/ui/StaggeredItem';
import { getMediaKey } from '@/lib/media';
import type { MediaGridProps } from '@/types/components';

export function MediaGrid({
	items,
	hideRating,
	showWatchlistMeta,
}: MediaGridProps) {
	const seenKeys = new Set<string>();
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
			{items.map((media, index) => {
				const key = getMediaKey(media);
				const enableSharedTransition = !seenKeys.has(key);
				seenKeys.add(key);
				return (
					<div
						key={key}
						style={{
							contentVisibility: 'auto',
							containIntrinsicSize: 'auto 320px',
						}}
					>
						<StaggeredItem index={index} animation="fadeIn">
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
								enableSharedTransition={enableSharedTransition}
							/>
						</StaggeredItem>
					</div>
				);
			})}
		</div>
	);
}
