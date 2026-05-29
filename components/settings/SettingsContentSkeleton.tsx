import { Skeleton } from '@/components/ui/skeleton';

export function SettingsContentSkeleton() {
	return (
		<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
			<aside className="lg:w-48 lg:sticky lg:top-20 h-fit">
				<nav className="flex lg:flex-col gap-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton
							key={i}
							className="h-10 w-10 lg:w-full rounded-lg shrink-0"
						/>
					))}
				</nav>
			</aside>

			<main className="flex-1 min-w-0 space-y-6">
				{Array.from({ length: 2 }).map((_, i) => (
					<div
						key={i}
						className="space-y-4 p-6 rounded-lg border border-border/20"
					>
						<Skeleton className="h-6 w-36" />
						<Skeleton className="h-4 w-52" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-32" />
					</div>
				))}
			</main>
		</div>
	);
}
