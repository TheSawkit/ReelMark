import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeadingSkeleton } from '@/components/ui/SectionHeading';

export function ContinueWatchingSkeleton() {
	return (
		<div className="mb-12 lg:mb-16">
			<div className="flex items-center h-7 md:pointer-fine:h-10 mb-4 px-1">
				<SectionHeadingSkeleton className="w-56" />
			</div>
			<div className="flex gap-4 overflow-hidden py-5 -my-5 px-4 -mx-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton
						key={i}
						className="h-72.5 w-72 shrink-0 rounded-poster"
					/>
				))}
			</div>
		</div>
	);
}
