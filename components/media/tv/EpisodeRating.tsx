'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useGuardedTransition } from '@/hooks/useGuardedTransition';
import { StarRating } from '@/components/ui/StarRating';
import { upsertReview } from '@/app/actions/reviews';
import { useEpisodeWatched } from '@/lib/stores/episode-watch';
import { useTranslation } from '@/lib/i18n/context';
import type { Review } from '@/types/profile';

const ReviewDialog = dynamic(
	() =>
		import('@/components/media/reviews/ReviewDialog').then(
			(m) => m.ReviewDialog
		),
	{ ssr: false }
);

interface EpisodeRatingProps {
	tvId: number;
	seasonNumber: number;
	episodeNumber: number;
	episodeId: number;
	episodeName: string;
	stillPath: string | null;
	initialWatched: boolean;
	initialReview: Review | null;
}

/**
 * Inline star rating shown on a watched episode, with the full review dialog kept one
 * click away — rating no longer interrupts a binge with a modal.
 */
export function EpisodeRating({
	tvId,
	seasonNumber,
	episodeNumber,
	episodeId,
	episodeName,
	stillPath,
	initialWatched,
	initialReview,
}: EpisodeRatingProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const [review, setReview] = useState<Review | null>(initialReview);
	const [rating, setRating] = useState<number | null>(
		initialReview?.rating ?? null
	);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [isPending, startTransition] = useGuardedTransition();

	const watched = useEpisodeWatched(
		tvId,
		seasonNumber,
		episodeNumber,
		initialWatched
	);

	if (!watched) return null;

	function handleRate(next: number) {
		const previous = rating;
		setRating(next);
		startTransition(async () => {
			try {
				const saved = await upsertReview(
					episodeId,
					'episode',
					episodeName,
					stillPath,
					next,
					review?.content ?? null,
					tvId,
					seasonNumber
				);
				setReview(saved);
				toast.success(t.movie.ratingSaved);
				router.refresh();
			} catch {
				setRating(previous);
				toast.error(t.common.actionError);
			}
		});
	}

	return (
		<>
			<div className="flex items-center gap-2">
				<StarRating
					value={rating}
					onChange={isPending ? undefined : handleRate}
					size="sm"
				/>
				<button
					onClick={() => setDialogOpen(true)}
					className="text-xs font-medium text-muted hover:text-text transition-colors cursor-pointer"
				>
					{review?.content ? t.movie.editReview : t.movie.writeReview}
				</button>
			</div>

			{dialogOpen && (
				<ReviewDialog
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
					mediaId={episodeId}
					mediaType="episode"
					mediaTitle={episodeName}
					posterPath={stillPath}
					tvId={tvId}
					seasonNumber={seasonNumber}
					existingReview={review}
					onSave={(saved) => {
						setReview(saved);
						setRating(saved.rating);
						router.refresh();
					}}
					onDelete={() => {
						setReview(null);
						setRating(null);
						router.refresh();
					}}
				/>
			)}
		</>
	);
}
