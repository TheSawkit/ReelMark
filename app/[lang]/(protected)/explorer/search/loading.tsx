import { SearchResultsSkeleton } from '@/components/search/SearchResultsSkeleton';
import { SearchBarSkeleton } from '@/components/search/SearchBarSkeleton';
import { PageLayout, PageHeaderSkeleton } from '@/components/layout/PageLayout';

export default function SearchLoading() {
	return (
		<PageLayout>
			<PageHeaderSkeleton subtitle={false} />

			<SearchBarSkeleton />

			<div className="mt-8">
				<SearchResultsSkeleton />
			</div>
		</PageLayout>
	);
}
