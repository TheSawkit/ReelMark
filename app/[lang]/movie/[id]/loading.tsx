import {
	DetailBannerSkeleton,
	DescriptionSkeleton,
	CastRowSkeleton,
} from '@/components/media/detail/MediaDetailSkeleton';

export default function MovieLoading() {
	return (
		<div className="min-h-screen">
			<DetailBannerSkeleton />

			<div className="container mx-auto px-6 lg:px-12 py-12 md:py-16 space-y-14 md:space-y-16">
				<DescriptionSkeleton />

				<CastRowSkeleton />
			</div>
		</div>
	);
}
