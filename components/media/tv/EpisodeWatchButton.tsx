'use client';

import { useState } from 'react';
import { Eye, Check, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleEpisodeWatch } from '@/app/actions/episodes';
import { useTranslation } from '@/lib/i18n/context';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ReviewDialog } from '@/components/media/reviews/ReviewDialog';

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
	const [watched, setWatched] = useState(initialWatched);
	const [reviewOpen, setReviewOpen] = useState(false);
	const { loading, error, execute } = useAsyncAction();
	const { t } = useTranslation();

	async function handleToggle(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		const newState = await execute(() =>
			toggleEpisodeWatch(tvId, seasonNumber, episodeNumber)
		);
		if (newState !== undefined) {
			setWatched(newState);
			if (newState) setReviewOpen(true);
		}
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
				/>
			)}
		</>
	);
}
