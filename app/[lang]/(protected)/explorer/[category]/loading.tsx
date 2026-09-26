import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { SearchBarSkeleton } from '@/components/search/SearchBarSkeleton';
import { CategoryNavSkeleton } from '@/components/navigation/CategoryNavSkeleton';
import { PageLayout, PageHeaderSkeleton } from '@/components/layout/PageLayout';

export default function CategoryLoading() {
	return (
		<PageLayout>
			<PageHeaderSkeleton subtitleWrapsOnMobile />
			<SearchBarSkeleton />
			<CategoryNavSkeleton />

			<div className="mt-8">
				<PosterGridSkeleton />
			</div>
		</PageLayout>
	);
}
