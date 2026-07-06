import { Skeleton } from '@/components/ui/skeleton';

export default function SeasonLoading() {
	return (
		<div className="min-h-screen">
			<Skeleton className="relative w-full min-h-[70vh] md:min-h-[80vh] flex flex-col justify-end overflow-hidden rounded-none banner-pull-top">
				<div className="absolute inset-0 bg-linear-to-t from-app-bg via-app-bg/40 to-transparent" />
				<div className="relative z-10 container mx-auto px-6 lg:px-12 pb-4 sm:pb-12">
					<div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-end">
						<div className="aspect-2/3 w-20 sm:w-40 md:w-48 lg:w-56 shrink-0 rounded-lg bg-surface-3" />
						<div className="flex-1 space-y-4">
							<div className="h-4 w-32 rounded bg-surface-3" />
							<div className="h-10 w-64 rounded-lg bg-surface-3" />
							<div className="flex gap-3">
								<div className="h-9 w-24 rounded-full bg-surface-3" />
								<div className="h-9 w-28 rounded-full bg-surface-3" />
							</div>
							<div className="h-12 w-48 rounded-full bg-surface-3" />
						</div>
					</div>
				</div>
			</Skeleton>

			<div className="detail-container">
				<div className="space-y-4 max-w-4xl">
					<Skeleton className="h-8 w-44 rounded" />
					<Skeleton className="h-4 w-full rounded" />
					<Skeleton className="h-4 w-2/3 rounded" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 9 }).map((_, i) => (
						<Skeleton
							key={i}
							className="rounded-poster overflow-hidden"
						>
							<div className="aspect-video w-full bg-surface-3" />
							<div className="p-4 space-y-3">
								<div className="h-5 w-3/4 bg-surface-3 rounded" />
								<div className="h-3 w-1/2 bg-surface-3 rounded" />
								<div className="h-3 w-full bg-surface-3 rounded" />
								<div className="h-3 w-2/3 bg-surface-3 rounded" />
							</div>
						</Skeleton>
					))}
				</div>
			</div>
		</div>
	);
}
