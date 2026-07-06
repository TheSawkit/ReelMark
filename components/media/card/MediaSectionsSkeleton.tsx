import { Skeleton } from '@/components/ui/skeleton';

interface MediaSectionsSkeletonProps {
	sections?: number;
	cardsPerSection?: number;
}

export function MediaSectionsSkeleton({
	sections = 3,
	cardsPerSection = 8,
}: MediaSectionsSkeletonProps) {
	return (
		<>
			{Array.from({ length: sections }).map((_, s) => (
				<div key={s} className="mb-12">
					<Skeleton className="h-8 w-48 rounded mb-6" />
					<div className="flex gap-4 overflow-hidden">
						{Array.from({ length: cardsPerSection }).map((_, i) => (
							<Skeleton
								key={i}
								className="flex-none w-40 aspect-2/3 rounded-(--radius-cinema)"
							/>
						))}
					</div>
				</div>
			))}
		</>
	);
}
