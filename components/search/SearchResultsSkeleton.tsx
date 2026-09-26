import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

/** Results-count line + poster grid, as rendered by the search results page. */
export function SearchResultsSkeleton() {
	return (
		<>
			<div className="-mt-6 mb-8 flex h-6 items-center">
				<Skeleton className="h-4 w-40 rounded" />
			</div>
			<PosterGridSkeleton />
		</>
	);
}
