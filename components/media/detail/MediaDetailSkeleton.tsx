import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeadingSkeleton } from '@/components/ui/SectionHeading';
import { cn } from '@/lib/utils';

const BANNER_VARIANTS = {
	movie: { eyebrow: false, tagline: true, actions: true },
	tv: { eyebrow: false, tagline: true, actions: true },
	season: { eyebrow: true, tagline: false, actions: true },
	collection: { eyebrow: false, tagline: true, actions: false },
	crew: { eyebrow: true, tagline: false, actions: false },
} as const;

const META_PILL_WIDTHS = ['w-16', 'w-14', 'w-18', 'w-10'] as const;

/** DetailHero placeholder: same stage, same centered-then-left column, same line boxes. */
export function DetailBannerSkeleton({
	variant,
}: {
	variant: keyof typeof BANNER_VARIANTS;
}) {
	const { eyebrow, tagline, actions } = BANNER_VARIANTS[variant];

	return (
		<Skeleton className="hero-stage relative isolate w-full flex flex-col justify-end overflow-hidden banner-pull-top banner-safe-pad pb-8 sm:pb-12 rounded-none">
			<div className="relative z-10 container mx-auto px-6 lg:px-12">
				<div className="mb-8 flex max-lg:hidden">
					<div className="h-11 w-11 rounded-full bg-surface-3" />
				</div>
				<div className="flex flex-col items-center gap-8 md:flex-row md:items-end">
					<div className="aspect-2/3 w-48 lg:w-56 shrink-0 rounded-lg bg-surface-3 max-md:hidden" />

					<div className="flex w-full min-w-0 max-w-4xl flex-col items-center gap-3 md:items-start">
						{eyebrow && (
							<div className="h-5 w-32 rounded bg-surface-3" />
						)}
						<div className="h-12 sm:h-15 lg:h-18 w-3/4 rounded-lg bg-surface-3" />
						{tagline && (
							<div className="h-6 sm:h-7 w-1/2 rounded bg-surface-3" />
						)}
						<div className="flex min-h-11 items-center gap-2">
							{META_PILL_WIDTHS.map((width) => (
								<div
									key={width}
									className={`h-8 ${width} rounded-full bg-surface-3`}
								/>
							))}
						</div>
						{actions ? (
							<>
								<div className="h-5 w-40 rounded bg-surface-3" />
								<div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
									<div className="h-12 w-full sm:w-44 rounded-xl bg-surface-3" />
									<div className="flex gap-2">
										<div className="h-11 flex-1 sm:w-36 rounded-full bg-surface-3" />
										<div className="h-11 flex-1 sm:w-36 rounded-full bg-surface-3" />
									</div>
								</div>
							</>
						) : (
							<div />
						)}
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
				<Skeleton className="h-12 w-12 lg:h-11 lg:w-32 rounded-full lg:rounded-lg shrink-0" />
				<Skeleton className="h-12 w-12 lg:h-11 lg:w-40 rounded-full lg:rounded-lg shrink-0" />
			</>
		);
	}

	return (
		<div className="flex w-full gap-2 sm:w-auto">
			<Skeleton className="h-11 flex-1 sm:w-40 sm:flex-none rounded-full" />
			<Skeleton className="h-11 flex-1 sm:w-40 sm:flex-none rounded-full" />
		</div>
	);
}

const DESCRIPTION_LINES_MOBILE = 8;
const DESCRIPTION_LINES_DESKTOP = 4;

/** Overview block: heading + text-lg/relaxed line boxes (8 lines on phones, 4 once max-w-prose applies). */
export function DescriptionSkeleton() {
	return (
		<section className="space-y-6">
			<SectionHeadingSkeleton />
			<div className="max-w-prose">
				{Array.from({ length: DESCRIPTION_LINES_MOBILE }).map(
					(_, i) => (
						<div
							key={i}
							className={cn(
								'flex h-7.25 items-center',
								i >= DESCRIPTION_LINES_DESKTOP && 'md:hidden'
							)}
						>
							<Skeleton className="h-4 w-full rounded" />
						</div>
					)
				)}
			</div>
		</section>
	);
}

export function CastRowSkeleton() {
	return (
		<div className="space-y-6">
			<SectionHeadingSkeleton />
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
