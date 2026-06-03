'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { ReviewDialog } from '@/components/media/reviews/ReviewDialog';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import type { Review, ReviewMediaType } from '@/types/profile';

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
	'flex items-center gap-2 glass-surface px-4 py-2 rounded-full shadow-card-sm';

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

	if (!rating && !isWatched) return null;

	const score = rating ? (rating.avg / 2).toFixed(1) : '—';
	const ariaLabel = initialReview
		? t.movie.editReview
		: mediaType === 'tv'
			? t.movie.rateTvShow
			: t.movie.rateMovie;

	const content = (
		<>
			<Star className="h-5 w-5 fill-primary text-primary" />
			<span className="font-semibold text-text tabular-nums">
				{score}
				{rating && rating.count > 0 && (
					<span className="text-muted text-xs font-normal ml-1.5">
						({rating.count})
					</span>
				)}
			</span>
		</>
	);

	if (!isWatched) {
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
					'min-h-11 cursor-pointer select-none transition duration-(--duration-fast) hover:bg-glass-bg-hover/80 active:scale-[0.97] active:bg-glass-bg-hover/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg'
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
					existingReview={initialReview}
					onSave={() => router.refresh()}
					onDelete={() => router.refresh()}
				/>
			)}
		</>
	);
}
