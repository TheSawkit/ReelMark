import { Skeleton } from '@/components/ui/skeleton';

/** SpotlightPick placeholder: fills the same hero stage, text blocks on the same line boxes. */
export function SpotlightPickSkeleton() {
	return (
		<>
			<Skeleton className="absolute inset-0 -z-10 rounded-none" />
			<div className="relative z-10 container mx-auto flex flex-col items-center gap-3 px-6 md:items-start lg:px-12">
				<Skeleton className="h-4 w-36 bg-surface-3" />
				<Skeleton className="h-12 w-2/3 bg-surface-3 sm:h-15 lg:h-18" />
				<Skeleton className="h-12 w-full max-w-xl bg-surface-3 max-md:hidden" />
				<div className="mt-2 flex w-full gap-3 sm:w-auto">
					<Skeleton className="h-11 flex-1 rounded-xl bg-surface-3 sm:w-40 sm:flex-none" />
					<Skeleton className="h-11 flex-1 rounded-full bg-surface-3 sm:w-40 sm:flex-none" />
				</div>
			</div>
		</>
	);
}
