'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Eye, Plus, Check, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addToWatchlist, removeFromWatchlist } from '@/app/actions/watchlist';
import { useTranslation } from '@/lib/i18n/context';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { mediaWatchStore, useMediaWatch } from '@/lib/media-watch-store';
import { episodeWatchStore } from '@/lib/episode-watch-store';
import { mediaRatingStore } from '@/lib/media-rating-store';
import type { WatchButtonProps } from '@/types/components';

const ReviewDialog = dynamic(
	() =>
		import('@/components/media/reviews/ReviewDialog').then(
			(m) => m.ReviewDialog
		),
	{ ssr: false }
);

export function WatchButton({
	mediaId,
	mediaTitle,
	mediaType,
	posterPath,
	status,
	initialIsActive = false,
	variant = 'icon',
	onDark = false,
	fallbackStatus,
	releaseDate,
}: WatchButtonProps) {
	const { loading, error, execute } = useAsyncAction();
	const [reviewOpen, setReviewOpen] = useState(false);
	const { t } = useTranslation();
	const router = useRouter();
	const storedStatus = useMediaWatch(mediaType, mediaId);

	const isActive =
		storedStatus !== undefined ? storedStatus === status : initialIsActive;
	const isUnreleased = releaseDate
		? new Date(releaseDate) > new Date()
		: false;

	if (status === 'watched' && isUnreleased && !isActive) {
		return null;
	}

	const reviewDialog = reviewOpen ? (
		<ReviewDialog
			open={reviewOpen}
			onClose={() => setReviewOpen(false)}
			mediaId={mediaId}
			mediaType={mediaType}
			mediaTitle={mediaTitle}
			posterPath={posterPath}
			onSave={(saved) => {
				mediaRatingStore.setMyReview(mediaType, mediaId, saved);
				mediaRatingStore.invalidateRating(mediaType, mediaId);
				router.refresh();
			}}
		/>
	) : null;

	async function handleClick(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const previous = mediaWatchStore.get(mediaType, mediaId);
		const target = isActive ? (fallbackStatus ?? 'none') : status;
		mediaWatchStore.set(mediaType, mediaId, target);

		const applied = await execute(async () => {
			if (target === 'none') {
				await removeFromWatchlist(mediaId, mediaType);
			} else {
				await addToWatchlist(
					mediaId,
					mediaTitle,
					posterPath,
					target,
					mediaType
				);
			}
			return true;
		});

		if (!applied) {
			mediaWatchStore.restore(mediaType, mediaId, previous);
			return;
		}
		if (mediaType === 'tv' && target === 'none') {
			episodeWatchStore.clearShow(mediaId);
		}
		if (target === 'watched') setReviewOpen(true);
	}

	const Icon = loading
		? Loader2
		: error
			? XCircle
			: isActive
				? Check
				: status === 'watched'
					? Eye
					: Plus;

	const stateLabel = error
		? t.common.actionError
		: isActive
			? status === 'watched'
				? t.movie.watched
				: t.movie.added
			: status === 'watched'
				? t.movie.markAsWatched
				: t.movie.addToList;

	if (variant === 'responsive') {
		return (
			<>
				<button
					onClick={handleClick}
					disabled={loading}
					aria-label={stateLabel}
					className={cn(
						'h-12 w-12 md:h-auto md:w-auto md:min-h-11 md:px-4 md:py-2.5',
						'rounded-full md:rounded-lg',
						'flex items-center justify-center gap-2 shrink-0',
						'backdrop-blur-2xl border text-sm font-semibold',
						'transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
						isActive
							? 'bg-primary/50 text-white border-white/10 shadow-glow-red'
							: 'bg-white/15 text-text border-white/10 hover:bg-white/25 hover:text-text shadow-card-sm'
					)}
				>
					<Icon
						className={cn(
							'h-4 w-4 shrink-0',
							loading && 'animate-spin'
						)}
					/>
					<span className="hidden md:inline">{stateLabel}</span>
				</button>
				{reviewDialog}
			</>
		);
	}

	if (variant === 'full') {
		return (
			<>
				<button
					onClick={handleClick}
					disabled={loading}
					className={cn(
						'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-11 w-full shrink-0',
						isActive
							? 'bg-primary/50 backdrop-blur-2xl text-white border-white/10 shadow-glow-red'
							: onDark
								? 'bg-white/15 backdrop-blur-2xl text-white/90 border-white/10 hover:bg-white/25 hover:text-white shadow-card-sm'
								: 'bg-white/15 backdrop-blur-2xl text-text border-white/10 hover:bg-white/25 hover:text-text shadow-card-sm'
					)}
				>
					<Icon
						className={cn('h-4 w-4', loading && 'animate-spin')}
					/>
					{stateLabel}
				</button>
				{reviewDialog}
			</>
		);
	}

	return (
		<>
			<button
				onClick={handleClick}
				disabled={loading}
				aria-label={stateLabel}
				title={stateLabel}
				className={cn(
					'h-12 w-12 rounded-full backdrop-blur-2xl border',
					'flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
					isActive
						? 'bg-primary/40 text-white border-border/10 border-t-border/20 shadow-glow-red'
						: 'bg-surface/20 text-muted border-border/10 border-t-border/20 hover:text-text hover:bg-surface-2/20 shadow-card-sm hover:border-border'
				)}
			>
				<Icon className={cn('h-4 w-4', loading && 'animate-spin')} />
			</button>
			{reviewDialog}
		</>
	);
}
