import {
	DetailBannerSkeleton,
	DescriptionSkeleton,
	CastRowSkeleton,
} from '@/components/media/detail/MediaDetailSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function TvShowLoading() {
	return (
		<div className="min-h-screen">
			<DetailBannerSkeleton />

			<div className="detail-container">
				<DescriptionSkeleton />

				<div className="space-y-6">
					<Skeleton className="h-8 w-40 rounded" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton
								key={i}
								className="flex gap-4 p-4 rounded-xl"
							>
								<div className="w-24 aspect-2/3 rounded-lg bg-surface/50" />
								<div className="flex-1 space-y-3 py-2">
									<div className="h-5 w-3/4 bg-surface/50 rounded" />
									<div className="h-4 w-1/2 bg-surface/50 rounded" />
									<div className="h-3 w-full mt-4 bg-surface/50 rounded" />
								</div>
							</Skeleton>
						))}
					</div>
				</div>

				<CastRowSkeleton />
			</div>
		</div>
	);
}
