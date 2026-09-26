import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeadingSkeleton } from '@/components/ui/SectionHeading';

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
				<div key={s} className="mb-12 lg:mb-16">
					<div className="flex items-center h-7 md:pointer-fine:h-10 mb-4 px-1">
						<SectionHeadingSkeleton />
					</div>
					<div className="flex gap-4 overflow-hidden py-5 -my-5 px-4 -mx-4">
						{Array.from({ length: cardsPerSection }).map((_, i) => (
							<Skeleton
								key={i}
								className="flex-none w-40 md:w-50 aspect-2/3 rounded-(--radius-cinema)"
							/>
						))}
					</div>
				</div>
			))}
		</>
	);
}
