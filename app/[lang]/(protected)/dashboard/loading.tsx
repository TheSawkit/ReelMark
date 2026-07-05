import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import {
	DashboardHeroSkeleton,
	BentoStatsSkeleton,
	TrendingMarqueeSkeleton,
} from '@/components/dashboard/DashboardSkeletons';

export default function DashboardLoading() {
	return (
		<PageLayout>
			<div className="mb-12 md:mb-16 space-y-3">
				<div className="h-9 w-64 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-4 w-96 rounded bg-surface-2 animate-pulse" />
			</div>

			<DashboardHeroSkeleton />
			<BentoStatsSkeleton />
			<TrendingMarqueeSkeleton />

			<div className="flex gap-2 mb-8">
				<div className="h-10 w-28 rounded-lg bg-surface-2 animate-pulse" />
				<div className="h-10 w-20 rounded-lg bg-surface-2 animate-pulse" />
			</div>
			<MediaSectionsSkeleton sections={3} cardsPerSection={8} />
		</PageLayout>
	);
}
