import { Skeleton } from '@/components/ui/skeleton';

export function DetailBannerSkeleton() {
	return (
		<Skeleton className="relative w-full -mt-16 min-h-[70vh] md:min-h-[80vh] flex items-end pb-12 rounded-none">
			<div className="container mx-auto px-6 lg:px-12 relative z-10">
				<div className="flex gap-6 md:gap-8 items-end">
					<div className="hidden md:block w-48 lg:w-56 aspect-2/3 rounded-lg bg-surface/50 border-2 border-border/10 h-full" />

					<div className="flex-1 space-y-4">
						<div className="h-12 md:h-16 lg:h-20 w-3/4 bg-surface/50 rounded-lg" />
						<div className="h-6 w-1/2 bg-surface/30 rounded" />
						<div className="flex gap-4">
							<div className="h-8 w-16 rounded-full bg-surface/50" />
							<div className="h-8 w-32 rounded-full bg-surface/50" />
							<div className="h-8 w-24 rounded-full bg-surface/50" />
						</div>

						<div className="flex gap-4 pt-4">
							<div className="h-10 w-32 rounded-md bg-surface/60" />
							<div className="h-10 w-32 rounded-md bg-surface/40" />
						</div>
					</div>
				</div>
			</div>
		</Skeleton>
	);
}

export function DetailSectionSkeleton() {
	return <Skeleton className="h-28 rounded-xl" />;
}

/** Placeholder for the watch buttons while the viewer's watchlist status streams in. */
export function WatchActionsSkeleton({
	variant,
}: {
	variant: 'banner' | 'bar';
}) {
	if (variant === 'bar') {
		return (
			<>
				<Skeleton className="h-12 w-12 md:h-11 md:w-32 rounded-full md:rounded-lg shrink-0" />
				<Skeleton className="h-12 w-12 md:h-11 md:w-40 rounded-full md:rounded-lg shrink-0" />
			</>
		);
	}

	return (
		<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
			<Skeleton className="h-11 w-full sm:w-40 rounded-lg" />
			<Skeleton className="h-11 w-full sm:w-48 rounded-lg" />
		</div>
	);
}

export function DescriptionSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-4 w-full rounded" />
			<Skeleton className="h-4 w-full rounded" />
			<Skeleton className="h-4 w-2/3 rounded" />
		</div>
	);
}

export function CastRowSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-40 rounded" />
			<div className="flex gap-4 overflow-hidden">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="flex-none w-32 space-y-2">
						<Skeleton className="aspect-square rounded-full" />
						<Skeleton className="h-4 w-20 mx-auto rounded" />
					</div>
				))}
			</div>
		</div>
	);
}
