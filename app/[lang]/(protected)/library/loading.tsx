import { LibraryViewSkeleton } from '@/components/library/LibraryViewSkeleton';
import { MediaTypeSwitcherSkeleton } from '@/components/media/card/MediaTypeSwitcherSkeleton';
import { PageLayout, PageHeaderSkeleton } from '@/components/layout/PageLayout';

export default function LibraryLoading() {
	return (
		<PageLayout>
			<PageHeaderSkeleton />
			<MediaTypeSwitcherSkeleton />
			<LibraryViewSkeleton />
		</PageLayout>
	);
}
