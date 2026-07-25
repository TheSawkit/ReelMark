import { Skeleton } from '@/components/ui/skeleton';

export function ProfileHeroSkeleton() {
	return (
		<div className="mb-10 overflow-hidden rounded-2xl border border-border bg-surface">
			<Skeleton className="h-28 w-full rounded-none sm:h-36" />
			<div className="px-5 pb-6 sm:px-7">
				<div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
					<Skeleton className="h-24 w-24 shrink-0 rounded-full border-4 border-surface" />
					<div className="flex-1 space-y-2 sm:pb-1">
						<Skeleton className="h-7 w-40" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-8 w-28 rounded-md sm:pb-1" />
				</div>
				<Skeleton className="mt-4 h-4 w-64" />
			</div>
		</div>
	);
}
