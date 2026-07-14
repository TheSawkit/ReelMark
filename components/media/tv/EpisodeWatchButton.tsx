'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Eye, Check, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setEpisodeWatched } from '@/app/actions/episodes';
import { episodeWatchStore, useSeasonWatch } from '@/lib/episode-watch-store';
import { mediaWatchStore } from '@/lib/media-watch-store';
import {
	isSeasonSkip,
	isCatchUpDismissed,
	missingEpisodesBefore,
} from '@/lib/season-catch-up';
import { useTranslation } from '@/lib/i18n/context';
import { useAsyncAction } from '@/hooks/useAsyncAction';

const ReviewDialog = dynamic(
	() =>
		import('@/components/media/reviews/ReviewDialog').then(
			(m) => m.ReviewDialog
		),
	{ ssr: false }
);

const SeasonCatchUpPrompt = dynamic(
	() =>
		import('@/components/media/tv/SeasonCatchUpPrompt').then(
			(m) => m.SeasonCatchUpPrompt
		),
	{ ssr: false }
);

interface EpisodeWatchButtonProps {
	tvId: number;
	seasonNumber: number;
	episodeNumber: number;
	totalEpisodes: number;
	initialWatched: boolean;
	episodeId: number;
	episodeName: string;
	stillPath: string | null;
}

export function EpisodeWatchButton({
	tvId,
	seasonNumber,
	episodeNumber,
	totalEpisodes,
	initialWatched,
	episodeId,
	episodeName,
	stillPath,
}: EpisodeWatchButtonProps) {
	const [reviewOpen, setReviewOpen] = useState(false);
	const [missingEpisodes, setMissingEpisodes] = useState<number[]>([]);
	const [catchUpOpen, setCatchUpOpen] = useState(false);
	const { loading, error, execute } = useAsyncAction();
	const { t } = useTranslation();
	const router = useRouter();

	const seasonState = useSeasonWatch(tvId, seasonNumber);
	const watched = seasonState?.episodes
		? seasonState.episodes.has(episodeNumber)
		: initialWatched;

	async function handleToggle(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (loading) return;
		const target = !watched;
		const watchedBefore = seasonState?.episodes ?? null;
		episodeWatchStore.setEpisode(tvId, seasonNumber, episodeNumber, target);
		const result = await execute(() =>
			setEpisodeWatched(tvId, seasonNumber, episodeNumber, target)
		);
		if (!result) {
			episodeWatchStore.setEpisode(
				tvId,
				seasonNumber,
				episodeNumber,
				!target
			);
			return;
		}
		mediaWatchStore.set('tv', tvId, result.tvStatus);
		if (!target) return;

		const skipped =
			watchedBefore !== null &&
			isSeasonSkip(episodeNumber, watchedBefore) &&
			!isCatchUpDismissed(tvId, seasonNumber);
		setMissingEpisodes(
			skipped ? missingEpisodesBefore(episodeNumber, watchedBefore) : []
		);
		setReviewOpen(true);
	}

	function handleReviewClose() {
		setReviewOpen(false);
		if (missingEpisodes.length > 0) setCatchUpOpen(true);
	}

	function handleCatchUpClose() {
		setCatchUpOpen(false);
		setMissingEpisodes([]);
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
					onClose={handleReviewClose}
					mediaId={episodeId}
					mediaType="episode"
					mediaTitle={episodeName}
					posterPath={stillPath}
					tvId={tvId}
					seasonNumber={seasonNumber}
					onSave={() => router.refresh()}
				/>
			)}

			{catchUpOpen && (
				<SeasonCatchUpPrompt
					open={catchUpOpen}
					onClose={handleCatchUpClose}
					tvId={tvId}
					seasonNumber={seasonNumber}
					episodeNumber={episodeNumber}
					totalEpisodes={totalEpisodes}
					missingEpisodes={missingEpisodes}
				/>
			)}
		</>
	);
}
