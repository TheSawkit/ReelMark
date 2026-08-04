'use client';

import { ProgressBar } from '@/components/shared/ProgressBar';
import { useTvWatchTotal } from '@/lib/stores/episode-watch';
import { useTranslation } from '@/lib/i18n/context';

interface TvWatchSummaryProps {
	tvId: number;
	totalEpisodes: number;
	seasons: { seasonNumber: number; watched: number }[];
}

/** Show-level watched progress pill, kept live from the episode watch store. */
export function TvWatchSummary({
	tvId,
	totalEpisodes,
	seasons,
}: TvWatchSummaryProps) {
	const { t } = useTranslation();
	const totalWatched = useTvWatchTotal(tvId, seasons);

	if (totalWatched === 0 || totalEpisodes === 0) return null;

	const overallPercent = Math.round((totalWatched / totalEpisodes) * 100);

	return (
		<div className="flex max-sm:hidden items-center gap-3 px-4 py-2 rounded-md glass-overlay">
			<div className="flex flex-col gap-1">
				<span className="text-xs font-medium text-muted">
					{totalWatched}/{totalEpisodes} {t.movie.episodes}
				</span>
				<ProgressBar
					watched={totalWatched}
					total={totalEpisodes}
					className="w-24 sm:w-32 h-1.5 bg-surface-3 rounded-full"
					innerClassName="bg-linear-to-r from-primary to-gold rounded-full"
				/>
			</div>
			<span className="text-sm font-bold text-text">
				{overallPercent}%
			</span>
		</div>
	);
}
