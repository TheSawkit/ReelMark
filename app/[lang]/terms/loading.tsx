import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function TermsLoading() {
	return (
		<PageLayout>
			<div className="mx-auto max-w-3xl">
				<div className="mb-12 md:mb-16 space-y-3">
					<Skeleton className="h-9 w-80 rounded-lg" />
					<Skeleton className="h-4 w-52 rounded" />
				</div>
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="mb-8 space-y-3">
						<Skeleton className="h-6 w-64 rounded" />
						<Skeleton className="h-4 w-full rounded" />
						<Skeleton className="h-4 w-full rounded" />
						<Skeleton className="h-4 w-3/4 rounded" />
					</div>
				))}
			</div>
		</PageLayout>
	);
}
