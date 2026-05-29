import { Skeleton } from '@/components/ui/skeleton';

export function ProfileHeroSkeleton() {
	return (
		<div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
			<Skeleton className="w-20 h-20 rounded-full shrink-0 border-2 border-border" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-4 w-24" />
				<div className="flex flex-wrap gap-2 mt-3">
					<Skeleton className="h-8 w-28 rounded-md" />
				</div>
			</div>
		</div>
	);
}
