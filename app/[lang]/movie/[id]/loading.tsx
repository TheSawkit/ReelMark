import {
	DetailBannerSkeleton,
	DescriptionSkeleton,
	CastRowSkeleton,
} from '@/components/media/detail/MediaDetailSkeleton';

export default function MovieLoading() {
	return (
		<div className="min-h-screen">
			<DetailBannerSkeleton />

			<div className="detail-container">
				<DescriptionSkeleton />

				<CastRowSkeleton />
			</div>
		</div>
	);
}
