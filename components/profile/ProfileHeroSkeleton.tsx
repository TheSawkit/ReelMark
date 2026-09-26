import { Skeleton } from '@/components/ui/skeleton';

/** ProfileHero placeholder: same full-bleed band, avatar and name on the same boxes. */
export function ProfileHeroSkeleton() {
	return (
		<section className="relative isolate overflow-hidden banner-pull-top banner-safe-pad pb-8 sm:pb-10">
			<Skeleton className="absolute inset-0 -z-10 rounded-none" />
			<div className="container mx-auto flex flex-col items-center gap-4 px-6 pt-6 sm:flex-row sm:items-end sm:gap-6 lg:px-12">
				<Skeleton className="h-28 w-28 shrink-0 rounded-full bg-surface-3 sm:h-32 sm:w-32" />
				<div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:items-start">
					<Skeleton className="h-12 w-48 bg-surface-3 sm:h-15" />
					<Skeleton className="h-5 w-24 bg-surface-3" />
					<Skeleton className="h-5.5 w-64 max-w-full bg-surface-3" />
					<div className="flex gap-2">
						<Skeleton className="h-8 w-24 rounded-full bg-surface-3" />
						<Skeleton className="h-8 w-20 rounded-full bg-surface-3" />
					</div>
				</div>
				<Skeleton className="h-8 w-28 rounded-md bg-surface-3 sm:mb-1" />
			</div>
		</section>
	);
}
