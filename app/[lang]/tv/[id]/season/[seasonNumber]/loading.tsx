import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeadingSkeleton } from '@/components/ui/SectionHeading';
import { DetailBannerSkeleton } from '@/components/media/detail/MediaDetailSkeleton';

export default function SeasonLoading() {
	return (
		<div className="min-h-screen">
			<DetailBannerSkeleton variant="season" />

			<div className="detail-container">
				<div className="space-y-4 max-w-4xl">
					<SectionHeadingSkeleton />
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
