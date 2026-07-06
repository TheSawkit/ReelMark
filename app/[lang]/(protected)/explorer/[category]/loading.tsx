import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
	return (
		<PageLayout>
			<div className="mb-12 md:mb-16 space-y-3">
				<Skeleton className="h-9 w-48 rounded-lg" />
				<Skeleton className="h-4 w-64 rounded" />
			</div>

			<Skeleton className="h-10 w-full max-w-xl rounded-lg mb-8" />

			<div className="flex flex-wrap gap-2 mb-10">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-10 w-28 rounded-full" />
				))}
			</div>

			<MediaSectionsSkeleton sections={1} cardsPerSection={20} />
		</PageLayout>
	);
}
