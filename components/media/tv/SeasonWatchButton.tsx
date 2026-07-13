'use client';

import { CheckCheck, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setSeasonWatched } from '@/app/actions/episodes';
import { episodeWatchStore, useSeasonWatch } from '@/lib/episode-watch-store';
import { useTranslation } from '@/lib/i18n/context';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface SeasonWatchButtonProps {
	tvId: number;
	seasonNumber: number;
	totalEpisodes: number;
	watchedCount: number;
}

export function SeasonWatchButton({
	tvId,
	seasonNumber,
	totalEpisodes,
	watchedCount,
}: SeasonWatchButtonProps) {
	const { loading, error, execute } = useAsyncAction();
	const { t } = useTranslation();

	const count = useSeasonWatch(tvId, seasonNumber)?.count ?? watchedCount;
	const allWatched = count >= totalEpisodes && totalEpisodes > 0;

	async function handleClick() {
		if (loading) return;
		const target = !allWatched;
		const previous = episodeWatchStore.get(tvId, seasonNumber);
		episodeWatchStore.setSeason(tvId, seasonNumber, target, totalEpisodes);
		const result = await execute(() =>
			setSeasonWatched(tvId, seasonNumber, totalEpisodes, target)
		);
		if (result === undefined) {
			episodeWatchStore.restore(tvId, seasonNumber, previous);
		}
	}

	const Icon = loading ? Loader2 : error ? XCircle : CheckCheck;

	return (
		<button
			onClick={handleClick}
			disabled={loading}
			className={cn(
				'flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-(--duration-base) border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12 w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-card',
				allWatched
					? 'bg-primary/40 backdrop-blur-2xl text-white border-border/10 border-t-border/20 shadow-glow-red'
					: 'bg-surface/20 backdrop-blur-2xl text-rating-gold border-border/10 border-t-border/20 hover:bg-rating-gold/10 hover:border-border hover:shadow-glow-gold hover:text-text shadow-card'
			)}
		>
			<Icon className={cn('h-5 w-5', loading && 'animate-spin')} />
			{error
				? t.common.actionError
				: allWatched
					? `${t.movie.seasonComplete} (${count}/${totalEpisodes})`
					: `${t.movie.markAllWatched} (${count}/${totalEpisodes})`}
		</button>
	);
}
