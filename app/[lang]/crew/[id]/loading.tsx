import { MediaCardSkeleton } from '@/components/media/card/MediaCardSkeleton';

export default function CrewLoading() {
	return (
		<div className="min-h-screen">
			<div className="relative w-full overflow-hidden">
				<div className="absolute inset-0 bg-surface-2 animate-pulse" />
				<div className="relative z-10 container mx-auto px-6 lg:px-12 py-12 md:py-16">
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

			<div className="container mx-auto px-6 lg:px-12 py-12 md:py-16 space-y-14 md:space-y-16">
				<div className="space-y-4">
					<div className="h-8 w-32 bg-surface-2 rounded animate-pulse" />
					<div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
					<div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
					<div className="h-4 w-3/4 bg-surface-2 rounded animate-pulse" />
				</div>

				<div className="space-y-6">
					<div className="h-8 w-48 bg-surface-2 rounded animate-pulse" />
					<div className="flex gap-2">
						<div className="h-10 w-28 rounded-lg bg-surface-2 animate-pulse" />
						<div className="h-10 w-28 rounded-lg bg-surface-2 animate-pulse" />
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{Array.from({ length: 12 }).map((_, i) => (
							<MediaCardSkeleton key={i} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
