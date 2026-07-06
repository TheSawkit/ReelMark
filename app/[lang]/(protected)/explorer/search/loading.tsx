import { MediaCardSkeleton } from '@/components/media/card/MediaCardSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchLoading() {
	return (
		<PageLayout>
			<div className="mb-12 md:mb-16 space-y-3">
				<Skeleton className="h-9 w-72 rounded-lg" />
				<Skeleton className="h-4 w-48 rounded" />
			</div>

			<Skeleton className="h-10 w-full max-w-xl rounded-lg mb-8" />

			<div className="mt-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
				{Array.from({ length: 14 }).map((_, i) => (
					<MediaCardSkeleton key={i} />
				))}
			</div>
		</PageLayout>
	);
}
