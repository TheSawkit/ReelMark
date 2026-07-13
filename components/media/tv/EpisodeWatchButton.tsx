'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Eye, Check, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setEpisodeWatched } from '@/app/actions/episodes';
import { episodeWatchStore, useSeasonWatch } from '@/lib/episode-watch-store';
import { useTranslation } from '@/lib/i18n/context';
import { useAsyncAction } from '@/hooks/useAsyncAction';

const ReviewDialog = dynamic(
	() =>
		import('@/components/media/reviews/ReviewDialog').then(
			(m) => m.ReviewDialog
		),
	{ ssr: false }
);

interface EpisodeWatchButtonProps {
	tvId: number;
	seasonNumber: number;
	episodeNumber: number;
	initialWatched: boolean;
	episodeId: number;
	episodeName: string;
	stillPath: string | null;
}

export function EpisodeWatchButton({
	tvId,
	seasonNumber,
	episodeNumber,
	initialWatched,
	episodeId,
	episodeName,
	stillPath,
}: EpisodeWatchButtonProps) {
	const [reviewOpen, setReviewOpen] = useState(false);
	const { loading, error, execute } = useAsyncAction();
	const { t } = useTranslation();

	const seasonState = useSeasonWatch(tvId, seasonNumber);
	const watched = seasonState?.episodes
		? seasonState.episodes.has(episodeNumber)
		: initialWatched;

	async function handleToggle(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (loading) return;
		const target = !watched;
		episodeWatchStore.setEpisode(tvId, seasonNumber, episodeNumber, target);
		const result = await execute(() =>
			setEpisodeWatched(tvId, seasonNumber, episodeNumber, target)
		);
		if (result === undefined) {
			episodeWatchStore.setEpisode(
				tvId,
				seasonNumber,
				episodeNumber,
				!target
			);
			return;
		}
		if (target) setReviewOpen(true);
	}

	const Icon = loading ? Loader2 : error ? XCircle : watched ? Check : Eye;

	return (
		<>
			<button
				onClick={handleToggle}
				disabled={loading}
				aria-label={
					watched
						? t.movie.episodeWatched
						: t.movie.markEpisodeWatched
				}
				className={cn(
					'flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
					watched
						? 'bg-primary/40 backdrop-blur-2xl text-white border-border/10 border-t-border/20 shadow-glow-red'
						: 'bg-surface/20 backdrop-blur-2xl text-muted border-border/10 border-t-border/20 hover:text-text hover:bg-surface-2/20 hover:border-border shadow-card-sm'
				)}
			>
				<Icon className={cn('h-4 w-4', loading && 'animate-spin')} />
				{error
					? t.common.actionError
					: watched
						? t.movie.episodeWatched
						: t.movie.markEpisodeWatched}
			</button>

			{reviewOpen && (
				<ReviewDialog
					open={reviewOpen}
					onClose={() => setReviewOpen(false)}
					mediaId={episodeId}
					mediaType="episode"
					mediaTitle={episodeName}
					posterPath={stillPath}
					tvId={tvId}
					seasonNumber={seasonNumber}
				/>
			)}
		</>
	);
}
