import { Skeleton } from '@/components/ui/skeleton';

export function ContinueWatchingSkeleton() {
	return (
		<div className="mb-12 lg:mb-16">
			<Skeleton className="mb-4 h-7 w-56 rounded" />
			<div className="flex gap-4 overflow-hidden">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton
						key={i}
						className="h-64 w-72 shrink-0 rounded-poster"
					/>
				))}
			</div>
		</div>
	);
}
