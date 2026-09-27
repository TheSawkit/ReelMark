import { MediaTypeSwitcherSkeleton } from '@/components/media/card/MediaTypeSwitcherSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import {
	DashboardHeroSkeleton,
	BentoStatsSkeleton,
	TrendingMarqueeSkeleton,
	LibrarySectionsSkeleton,
} from '@/components/dashboard/DashboardSkeletons';
import { ContinueWatchingSkeleton } from '@/components/dashboard/ContinueWatchingSkeleton';

export default function DashboardLoading() {
	return (
		<>
			<DashboardHeroSkeleton />
			<PageLayout className="pt-6 lg:pt-8">
				<ContinueWatchingSkeleton />
				<BentoStatsSkeleton />
				<TrendingMarqueeSkeleton />
				<MediaTypeSwitcherSkeleton />
				<LibrarySectionsSkeleton />
			</PageLayout>
		</>
	);
}
