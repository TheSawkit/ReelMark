import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function CrewLoading() {
	return (
		<div className="min-h-screen">
			<div className="relative w-full overflow-hidden">
				<Skeleton className="absolute inset-0 rounded-none" />
				<div className="relative z-10 container mx-auto px-6 lg:px-12 py-section md:py-section-md">
					<div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
						<div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 shrink-0 rounded-full bg-surface/50 border-4 border-border/20" />
						<div className="flex-1 space-y-4 text-center md:text-left">
							<div className="h-10 md:h-14 lg:h-16 w-1/2 bg-surface/50 rounded-lg" />
							<div className="h-5 w-1/3 bg-surface/30 rounded" />
							<div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
								{Array.from({ length: 3 }).map((_, i) => (
									<div
										key={i}
										className="h-8 w-28 rounded-full bg-surface/30"
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="detail-container">
				<div className="space-y-4">
					<Skeleton className="h-8 w-32 rounded" />
					<Skeleton className="h-4 w-full rounded" />
					<Skeleton className="h-4 w-full rounded" />
					<Skeleton className="h-4 w-3/4 rounded" />
				</div>

				<div className="space-y-6">
					<Skeleton className="h-8 w-48 rounded" />
					<div className="flex gap-2">
						<Skeleton className="h-10 w-28 rounded-lg" />
						<Skeleton className="h-10 w-28 rounded-lg" />
					</div>
					<PosterGridSkeleton />
				</div>
			</div>
		</div>
	);
}
