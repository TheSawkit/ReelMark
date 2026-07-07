import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExplorerLoading() {
	return (
		<PageLayout>
			<div className="mb-12 md:mb-16 space-y-3">
				<Skeleton className="h-9 w-48 rounded-lg" />
				<Skeleton className="h-4 w-80 rounded" />
			</div>

			<div className="flex flex-wrap gap-2 mb-10">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-10 w-28 rounded-full" />
				))}
			</div>

			<MediaSectionsSkeleton sections={3} cardsPerSection={8} />
		</PageLayout>
	);
}
