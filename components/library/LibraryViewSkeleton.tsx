import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { MediaListControlsSkeleton } from '@/components/media/list/MediaListControlsSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

/** Status tabs + list controls + poster grid, as LibraryTabs lays them out. */
export function LibraryViewSkeleton() {
	return (
		<>
			<Skeleton className="h-13.5 w-full mb-8 rounded-xl" />
			<MediaListControlsSkeleton className="mb-6" />
			<PosterGridSkeleton count={12} variant="library" />
		</>
	);
}
