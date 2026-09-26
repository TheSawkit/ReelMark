import { Skeleton } from '@/components/ui/skeleton';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { MediaListControlsSkeleton } from '@/components/media/list/MediaListControlsSkeleton';

const TAB_WIDTHS = ['w-28', 'w-28', 'w-24', 'w-24', 'w-24'] as const;
const FILTER_WIDTHS = ['w-15', 'w-22', 'w-20'] as const;

/** Tab bar + watchlist tab (type chips, list controls, grid): the tab a profile opens on. */
export function ProfileTabsSkeleton() {
	return (
		<div>
			<div className="flex gap-1 border-b border-border-subtle mb-6 overflow-hidden">
				{TAB_WIDTHS.map((width, i) => (
					<Skeleton
						key={i}
						className={`h-10.5 ${width} -mb-px shrink-0 rounded-none rounded-t`}
					/>
				))}
			</div>
			<div className="flex gap-1.5 mb-5 flex-wrap">
				{FILTER_WIDTHS.map((width) => (
					<Skeleton
						key={width}
						className={`h-8 ${width} rounded-full`}
					/>
				))}
			</div>
			<MediaListControlsSkeleton className="mb-5" />
			<PosterGridSkeleton />
		</div>
	);
}
