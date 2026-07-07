import { Skeleton } from '@/components/ui/skeleton';

export function DashboardHeroSkeleton() {
	return <Skeleton className="mb-10 h-104 w-full rounded-3xl sm:h-112" />;
}

export function BentoStatsSkeleton() {
	return (
		<div className="mb-10 grid grid-cols-3 gap-3 sm:gap-4">
			{Array.from({ length: 3 }).map((_, i) => (
				<Skeleton key={i} className="h-28 rounded-2xl" />
			))}
		</div>
	);
}

export function TrendingMarqueeSkeleton() {
	return (
		<div className="mb-12 flex gap-3.5 overflow-hidden">
			{Array.from({ length: 8 }).map((_, i) => (
				<Skeleton
					key={i}
					className="aspect-2/3 w-28 shrink-0 rounded-poster sm:w-32"
				/>
			))}
		</div>
	);
}
