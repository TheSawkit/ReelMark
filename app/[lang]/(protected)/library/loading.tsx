import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function LibraryLoading() {
	return (
		<PageLayout>
			<div className="mb-12 md:mb-16 space-y-3">
				<Skeleton className="h-9 w-56 rounded-lg" />
				<Skeleton className="h-4 w-36 rounded" />
			</div>

			<div className="flex gap-2 mb-8">
				<Skeleton className="h-10 w-28 rounded-lg" />
				<Skeleton className="h-10 w-28 rounded-lg" />
			</div>

			<div className="flex gap-2 border-b border-border pb-0 mb-8">
				<Skeleton className="h-10 w-24 rounded-t-lg" />
				<Skeleton className="h-10 w-20 rounded-t-lg" />
			</div>

			<PosterGridSkeleton count={6} />
		</PageLayout>
	);
}
