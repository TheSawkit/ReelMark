import {
	DetailBannerSkeleton,
	DescriptionSkeleton,
	CastRowSkeleton,
} from '@/components/media/detail/MediaDetailSkeleton';

export default function MovieLoading() {
	return (
		<div className="min-h-screen">
			<DetailBannerSkeleton />

			<div className="container mx-auto px-6 lg:px-12 py-8 space-y-12">
				<DescriptionSkeleton />

				<CastRowSkeleton />
			</div>
		</div>
	);
}
