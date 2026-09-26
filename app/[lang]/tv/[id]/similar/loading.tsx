import { PageLayout, PageHeaderSkeleton } from '@/components/layout/PageLayout';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';

export default function SimilarLoading() {
	return (
		<PageLayout>
			<PageHeaderSkeleton />
			<PosterGridSkeleton />
		</PageLayout>
	);
}
