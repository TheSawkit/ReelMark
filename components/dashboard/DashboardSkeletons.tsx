export function DashboardHeroSkeleton() {
	return (
		<div className="mb-10 h-104 w-full rounded-3xl bg-surface-2 animate-pulse sm:h-112" />
	);
}

export function BentoStatsSkeleton() {
	return (
		<div className="mb-10 grid grid-cols-3 gap-3 sm:gap-4">
			{Array.from({ length: 3 }).map((_, i) => (
				<div
					key={i}
					className="h-28 rounded-2xl bg-surface-2 animate-pulse"
				/>
			))}
		</div>
	);
}

export function TrendingMarqueeSkeleton() {
	return (
		<div className="mb-12 flex gap-3.5 overflow-hidden">
			{Array.from({ length: 8 }).map((_, i) => (
				<div
					key={i}
					className="aspect-2/3 w-28 shrink-0 rounded-poster bg-surface-2 animate-pulse sm:w-32"
				/>
			))}
		</div>
	);
}
