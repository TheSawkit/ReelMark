'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Eye, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionStatusIcon } from '@/components/ui/ActionStatusIcon';
import { addToWatchlist, removeFromWatchlist } from '@/app/actions/watchlist';
import { useTranslation } from '@/lib/i18n/context';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';
import { useIsUnreleased } from '@/hooks/useIsUnreleased';
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
	blur = true,
	fallbackStatus,
	releaseDate,
}: WatchButtonProps) {
	const { loading, error, run } = useOptimisticAction();
	const [reviewOpen, setReviewOpen] = useState(false);
	const { t } = useTranslation();
	const router = useRouter();
	const storedStatus = useMediaWatch(mediaType, mediaId);

	const isActive =
		storedStatus !== undefined ? storedStatus === status : initialIsActive;
	const isUnreleased = useIsUnreleased(releaseDate);

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

		await run({
			apply: () => mediaWatchStore.set(mediaType, mediaId, target),
			rollback: () =>
				mediaWatchStore.restore(mediaType, mediaId, previous),
			action: async () => {
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
			},
			onSuccess: () => {
				if (mediaType === 'tv' && target === 'none') {
					episodeWatchStore.clearShow(mediaId);
				}
				if (target === 'watched') setReviewOpen(true);
			},
		});
	}

	const idleIcon = isActive ? Check : status === 'watched' ? Eye : Plus;

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
						'h-12 w-12 lg:h-auto lg:w-auto lg:min-h-11 lg:px-4 lg:py-2.5',
						'rounded-full lg:rounded-lg',
						'flex items-center justify-center gap-2 shrink-0',
						'border text-sm font-semibold',
						'transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
						isActive
							? 'bg-primary/50 text-white border-white/10 shadow-glow-red'
							: 'bg-white/15 text-text border-white/10 hover:bg-white/25 hover:text-text shadow-card-sm'
					)}
				>
					<ActionStatusIcon
						loading={loading}
						error={error}
						icon={idleIcon}
						className="h-4 w-4 shrink-0"
					/>
					<span className="hidden lg:inline">{stateLabel}</span>
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
						blur && 'backdrop-blur-2xl',
						isActive
							? 'bg-primary/50 text-white border-white/10 shadow-glow-red'
							: onDark
								? 'bg-white/15 text-white/90 border-white/10 hover:bg-white/25 hover:text-white shadow-card-sm'
								: 'bg-white/15 text-text border-white/10 hover:bg-white/25 hover:text-text shadow-card-sm'
					)}
				>
					<ActionStatusIcon
						loading={loading}
						error={error}
						icon={idleIcon}
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
				<ActionStatusIcon
					loading={loading}
					error={error}
					icon={idleIcon}
				/>
			</button>
			{reviewDialog}
		</>
	);
}
