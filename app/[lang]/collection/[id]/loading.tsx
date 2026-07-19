import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';

export default function CollectionLoading() {
	return (
		<PageLayout>
			<div className="mb-12 md:mb-16 space-y-3">
				<Skeleton className="h-10 w-72 rounded-lg" />
			</div>
			<PosterGridSkeleton />
		</PageLayout>
	);
}
