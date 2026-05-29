import { Skeleton } from '@/components/ui/skeleton';
import { MediaCardSkeleton } from '@/components/media/card/MediaCardSkeleton';

export function ProfileTabsSkeleton() {
	return (
		<div>
			<div className="flex gap-1 border-b border-border-subtle mb-6 overflow-x-auto pb-px">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-9 w-20 shrink-0 rounded-none rounded-t" />
				))}
			</div>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
				{Array.from({ length: 12 }).map((_, i) => (
					<MediaCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
