import { MediaSectionsSkeleton } from '@/components/media/card/MediaSectionsSkeleton';
import { MediaTypeSwitcherSkeleton } from '@/components/media/card/MediaTypeSwitcherSkeleton';
import { SpotlightPickSkeleton } from '@/components/explorer/SpotlightPickSkeleton';
import { CategoryNavSkeleton } from '@/components/navigation/CategoryNavSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';

export default function ExplorerLoading() {
	return (
		<div data-skeleton="explorer" className="contents">
			<section className="hero-stage relative isolate flex flex-col justify-end overflow-hidden banner-pull-top banner-safe-pad pb-8 sm:pb-12">
				<SpotlightPickSkeleton />
				<div className="absolute inset-x-0 top-0 z-20 banner-safe-pad">
					<MediaTypeSwitcherSkeleton />
				</div>
			</section>

			<PageLayout className="pt-6 lg:pt-8">
				<div className="mb-8 min-h-11">
					<CategoryNavSkeleton />
				</div>
				<MediaSectionsSkeleton sections={4} cardsPerSection={8} />
			</PageLayout>
		</div>
	);
}
