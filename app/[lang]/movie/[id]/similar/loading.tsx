import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';

export default function SimilarMoviesLoading() {
	return (
		<PageLayout>
			<div className="mb-12 md:mb-16 space-y-3">
				<Skeleton className="h-10 w-72 rounded-lg" />
				<Skeleton className="h-6 w-48 rounded-lg" />
			</div>
			<PosterGridSkeleton />
		</PageLayout>
	);
}
