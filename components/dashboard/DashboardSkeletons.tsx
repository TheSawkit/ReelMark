import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeadingSkeleton } from '@/components/ui/SectionHeading';
import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { ForYouSectionSkeleton } from '@/components/dashboard/ForYouSectionSkeleton';

/** DashboardHero placeholder: same full-bleed stage, greeting and resume block on the same line boxes. */
export function DashboardHeroSkeleton() {
	return (
		<section className="hero-stage relative isolate flex flex-col justify-end overflow-hidden banner-pull-top banner-safe-pad pb-8 sm:pb-12">
			<Skeleton className="absolute inset-0 -z-10 rounded-none" />
			<div className="relative z-10 container mx-auto flex flex-col items-center gap-3 px-6 md:items-start lg:px-12">
				<div className="flex min-h-two-lines items-end text-sm">
					<Skeleton className="h-5 w-56 bg-surface-3" />
				</div>
				<Skeleton className="h-12 w-2/3 bg-surface-3 sm:h-15 lg:h-18" />
				<Skeleton className="h-5 w-40 bg-surface-3" />
				<Skeleton className="h-1.5 w-full max-w-xs bg-surface-3" />
				<Skeleton className="mt-2 h-12 w-full rounded-xl bg-surface-3 sm:w-44" />
			</div>
		</section>
	);
}

export function BentoStatsSkeleton() {
	return (
		<section className="mb-10 space-y-4">
			<SectionHeadingSkeleton />
			<div className="grid grid-cols-3 gap-3 sm:gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-37.5 sm:h-38 rounded-xl" />
				))}
			</div>
		</section>
	);
}

export function TrendingMarqueeSkeleton() {
	return (
		<section className="mb-12">
			<div className="mb-4">
				<SectionHeadingSkeleton />
			</div>
			<div className="flex gap-3.5 overflow-hidden">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton
						key={i}
						className="aspect-2/3 w-28 shrink-0 rounded-poster sm:w-32"
					/>
				))}
			</div>
		</section>
	);
}

/** Personalized rows placeholder in their usual order: next watchings, "For you" with its reasons, then one more row. */
export function LibrarySectionsSkeleton() {
	return (
		<>
			<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
			<ForYouSectionSkeleton />
			<MediaSectionsSkeleton sections={1} cardsPerSection={8} />
		</>
	);
}
