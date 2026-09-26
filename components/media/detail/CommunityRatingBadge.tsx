'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { useMediaWatch } from '@/lib/stores/media-watch';
import {
	mediaRatingStore,
	useMediaRating,
	useMyReview,
} from '@/lib/stores/media-rating';
import type { Review, ReviewMediaType } from '@/types/profile';

const ReviewDialog = dynamic(
	() =>
		import('@/components/media/reviews/ReviewDialog').then(
			(m) => m.ReviewDialog
		),
	{ ssr: false }
);

interface CommunityRatingBadgeProps {
	rating: { avg: number; count: number } | null;
	isWatched: boolean;
	mediaId: number;
	mediaType: Exclude<ReviewMediaType, 'episode'>;
	mediaTitle: string;
	posterPath: string | null;
	initialReview: Review | null;
}

const BADGE_CLASSES =
	'flex h-8 shrink-0 items-center gap-1.5 glass-surface px-3 rounded-full text-sm shadow-card-xs';

export function CommunityRatingBadge({
	rating,
	isWatched,
	mediaId,
	mediaType,
	mediaTitle,
	posterPath,
	initialReview,
}: CommunityRatingBadgeProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const review = useMyReview(mediaType, mediaId, initialReview);
	const liveRating = useMediaRating(mediaType, mediaId, rating);
	const watchStatus = useMediaWatch(mediaType, mediaId);
	const watched =
		watchStatus !== undefined ? watchStatus === 'watched' : isWatched;

	if (!liveRating && !watched) return null;

	const score = liveRating ? (liveRating.avg / 2).toFixed(1) : '—';
	const ariaLabel = review
		? t.movie.editReview
		: mediaType === 'tv'
			? t.movie.rateTvShow
			: t.movie.rateMovie;

	const content = (
		<>
			<Star className="h-4 w-4 fill-primary text-primary" />
			<span className="font-semibold text-text tabular-nums">
				{score}
				{liveRating && liveRating.count > 0 && (
					<span className="text-muted text-xs font-normal ml-1.5">
						({liveRating.count})
					</span>
				)}
			</span>
		</>
	);

	if (!watched) {
		return <div className={BADGE_CLASSES}>{content}</div>;
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label={ariaLabel}
				className={cn(
					BADGE_CLASSES,
					"relative after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']",
					'cursor-pointer select-none transition duration-(--duration-fast) hover:bg-glass-bg-hover/80 active:scale-[0.97] active:bg-glass-bg-hover/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg'
				)}
			>
				{content}
			</button>

			{open && (
				<ReviewDialog
					open={open}
					onClose={() => setOpen(false)}
					mediaId={mediaId}
					mediaType={mediaType}
					mediaTitle={mediaTitle}
					posterPath={posterPath}
					existingReview={review}
					onSave={(saved) => {
						mediaRatingStore.applyUserRating(
							mediaType,
							mediaId,
							liveRating,
							review?.rating ?? null,
							saved.rating
						);
						mediaRatingStore.setMyReview(mediaType, mediaId, saved);
						router.refresh();
					}}
					onDelete={() => {
						mediaRatingStore.applyUserRating(
							mediaType,
							mediaId,
							liveRating,
							review?.rating ?? null,
							null
						);
						mediaRatingStore.setMyReview(mediaType, mediaId, null);
						router.refresh();
					}}
				/>
			)}
		</>
	);
}
