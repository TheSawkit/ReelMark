import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeadingSkeleton } from '@/components/ui/SectionHeading';

const CARDS = 8;

/** Placeholder of the "For you" row: posters plus the two-line reason under each, so the rows below don't jump when it streams in. */
export function ForYouSectionSkeleton() {
	return (
		<div className="mb-12 lg:mb-16">
			<div className="flex items-center h-7 md:pointer-fine:h-10 mb-4 px-1">
				<SectionHeadingSkeleton />
			</div>
			<div className="flex gap-4 overflow-hidden py-5 -my-5 px-4 -mx-4">
				{Array.from({ length: CARDS }).map((_, i) => (
					<div
						key={i}
						className="flex flex-none w-40 md:w-50 flex-col gap-2"
					>
						<Skeleton className="aspect-2/3 rounded-(--radius-cinema)" />
						<div className="flex flex-col gap-1.5 px-1 py-0.5">
							<Skeleton className="h-3 w-full rounded-sm" />
							<Skeleton className="h-3 w-2/3 rounded-sm" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
