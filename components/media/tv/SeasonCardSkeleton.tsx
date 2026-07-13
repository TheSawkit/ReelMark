import { Skeleton } from '@/components/ui/skeleton';

export function SeasonCardSkeleton() {
	return (
		<div className="flex gap-4 bg-surface-2 rounded-xl p-4 border border-border/10">
			<Skeleton className="w-24 h-36 shrink-0 rounded-lg" />
			<div className="flex flex-col flex-1 py-1 gap-2 min-w-0">
				<Skeleton className="h-6 w-2/3 rounded" />
				<div className="flex flex-col gap-2 mt-auto">
					<Skeleton className="h-4 w-24 rounded" />
					<Skeleton className="h-4 w-32 rounded" />
				</div>
			</div>
		</div>
	);
}
