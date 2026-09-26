import { PageLayout } from '@/components/layout/PageLayout';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { DetailBannerSkeleton } from '@/components/media/detail/MediaDetailSkeleton';

export default function CollectionLoading() {
	return (
		<>
			<DetailBannerSkeleton variant="collection" />
			<PageLayout>
				<PosterGridSkeleton />
			</PageLayout>
		</>
	);
}
