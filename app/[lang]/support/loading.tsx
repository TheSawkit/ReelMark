import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupportLoading() {
	return (
		<PageLayout>
			<div className="mx-auto max-w-3xl">
				<div className="mb-12 md:mb-16 space-y-3">
					<Skeleton className="h-9 w-72 rounded-lg" />
					<Skeleton className="h-4 w-64 rounded" />
				</div>
				<div className="mb-10 space-y-3">
					<Skeleton className="h-4 w-full rounded" />
					<Skeleton className="h-4 w-full rounded" />
					<Skeleton className="h-4 w-2/3 rounded" />
				</div>
				<Skeleton className="h-6 w-56 rounded mb-4" />
				<div className="grid gap-3 sm:grid-cols-2 mb-10">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-12 rounded-lg" />
					))}
				</div>
				<div className="mb-10 space-y-3">
					<Skeleton className="h-6 w-48 rounded" />
					<Skeleton className="h-4 w-full rounded" />
					<Skeleton className="h-4 w-3/4 rounded" />
				</div>
				<Skeleton className="h-40 rounded-2xl" />
			</div>
		</PageLayout>
	);
}
