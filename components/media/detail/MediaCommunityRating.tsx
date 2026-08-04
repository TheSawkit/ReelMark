'use client';

import { CommunityRating } from '@/components/media/detail/CommunityRating';
import {
	useMediaRating,
	type CommunityRating as Rating,
} from '@/lib/stores/media-rating';
import type { ReviewMediaType } from '@/types/profile';

interface MediaCommunityRatingProps {
	mediaId: number;
	mediaType: Exclude<ReviewMediaType, 'episode'>;
	initialRating: Rating | null;
}

/** Community rating section for movie/TV detail pages, kept in sync with the banner badge after the viewer rates. */
export function MediaCommunityRating({
	mediaId,
	mediaType,
	initialRating,
}: MediaCommunityRatingProps) {
	const rating = useMediaRating(mediaType, mediaId, initialRating);

	if (!rating) return null;

	return <CommunityRating avg={rating.avg} count={rating.count} />;
}
