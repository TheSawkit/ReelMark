import {
	DetailBannerSkeleton,
	DescriptionSkeleton,
	CastRowSkeleton,
} from '@/components/media/detail/MediaDetailSkeleton';

export default function MovieLoading() {
	return (
		<div data-skeleton="movie" className="min-h-screen">
			<DetailBannerSkeleton variant="movie" />

			<div className="detail-container">
				<DescriptionSkeleton />

				<CastRowSkeleton />
			</div>
		</div>
	);
}
