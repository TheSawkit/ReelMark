'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Eye, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionStatusIcon } from '@/components/ui/ActionStatusIcon';
import { setEpisodeWatched } from '@/app/actions/episodes';
import {
	episodeWatchStore,
	useSeasonWatch,
	useEpisodeWatched,
} from '@/lib/episode-watch-store';
import { mediaWatchStore } from '@/lib/media-watch-store';
import {
	isSeasonSkip,
	isCatchUpDismissed,
	missingEpisodesBefore,
} from '@/lib/season-catch-up';
import { useTranslation } from '@/lib/i18n/context';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';

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
}

export function EpisodeWatchButton({
	tvId,
	seasonNumber,
	episodeNumber,
	totalEpisodes,
	initialWatched,
}: EpisodeWatchButtonProps) {
	const [missingEpisodes, setMissingEpisodes] = useState<number[]>([]);
	const { loading, error, run } = useOptimisticAction();
	const { t } = useTranslation();
	const router = useRouter();

	const seasonState = useSeasonWatch(tvId, seasonNumber);
	const watched = useEpisodeWatched(
		tvId,
		seasonNumber,
		episodeNumber,
		initialWatched
	);

	async function handleToggle(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		const target = !watched;
		const watchedBefore = seasonState?.episodes ?? null;

		await run({
			apply: () =>
				episodeWatchStore.setEpisode(
					tvId,
					seasonNumber,
					episodeNumber,
					target
				),
			rollback: () =>
				episodeWatchStore.setEpisode(
					tvId,
					seasonNumber,
					episodeNumber,
					!target
				),
			action: () =>
				setEpisodeWatched(tvId, seasonNumber, episodeNumber, target),
			onSuccess: (result) => {
				mediaWatchStore.set('tv', tvId, result.tvStatus);
				if (result.addedToWatchlist) router.refresh();
				if (!target || watchedBefore === null) return;

				const skipped =
					isSeasonSkip(episodeNumber, watchedBefore) &&
					!isCatchUpDismissed(tvId, seasonNumber);
				if (skipped) {
					setMissingEpisodes(
						missingEpisodesBefore(episodeNumber, watchedBefore)
					);
				}
			},
		});
	}

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
						? 'bg-primary/40 text-white border-border/10 border-t-border/20 shadow-control-lift'
						: 'bg-surface/70 text-muted border-border/10 border-t-border/20 hover:text-text hover:bg-surface-2/70 hover:border-border shadow-card-sm'
				)}
			>
				<ActionStatusIcon
					loading={loading}
					error={error}
					icon={watched ? Check : Eye}
				/>
				{error
					? t.common.actionError
					: watched
						? t.movie.episodeWatched
						: t.movie.markEpisodeWatched}
			</button>

			{missingEpisodes.length > 0 && (
				<SeasonCatchUpPrompt
					open
					onClose={() => setMissingEpisodes([])}
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
