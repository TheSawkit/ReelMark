import { getPublicReviews } from '@/lib/data/reviews';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getTranslations } from '@/lib/i18n/server';
import { ReviewsList } from '@/components/media/reviews/ReviewsList';
import type { ReviewMediaType } from '@/types/profile';

interface PublicReviewsSectionProps {
	mediaId: number;
	mediaType: ReviewMediaType;
}

export async function PublicReviewsSection({
	mediaId,
	mediaType,
}: PublicReviewsSectionProps) {
	const [reviews, t] = await Promise.all([
		getPublicReviews(mediaId, mediaType),
		getTranslations(),
	]);

	if (reviews.length === 0) return null;

	return (
		<section className="space-y-5">
			<SectionHeading>
				{t.movie.communityReviews}
				<span className="text-muted font-normal text-base ml-0.5">
					({reviews.length})
				</span>
			</SectionHeading>
			<ReviewsList reviews={reviews} />
		</section>
	);
}
