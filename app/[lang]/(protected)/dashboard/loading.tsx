import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { MediaTypeSwitcherSkeleton } from '@/components/media/card/MediaTypeSwitcherSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import {
	DashboardHeroSkeleton,
	BentoStatsSkeleton,
	TrendingMarqueeSkeleton,
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
				<MediaSectionsSkeleton sections={3} cardsPerSection={8} />
			</PageLayout>
		</>
	);
}
