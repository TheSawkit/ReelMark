'use client';

import { Eye, Check, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeasonWatch } from '@/lib/episode-watch-store';
import { useTranslation } from '@/lib/i18n/context';
import { useSeasonWatchToggle } from '@/hooks/useSeasonWatchToggle';
import { useIsUnreleased } from '@/hooks/useIsUnreleased';

interface SeasonWatchIconProps {
	tvId: number;
	seasonNumber: number;
	totalEpisodes: number;
	watchedCount: number;
	releaseDate?: string;
}

export function SeasonWatchIcon({
	tvId,
	seasonNumber,
	totalEpisodes,
	watchedCount,
	releaseDate,
}: SeasonWatchIconProps) {
	const { t } = useTranslation();
	const { loading, error, toggle } = useSeasonWatchToggle(
		tvId,
		seasonNumber,
		totalEpisodes
	);

	const count = useSeasonWatch(tvId, seasonNumber)?.count ?? watchedCount;
	const allWatched = count >= totalEpisodes && totalEpisodes > 0;

	const isUnreleased = useIsUnreleased(releaseDate);

	if (isUnreleased && !allWatched) {
		return null;
	}

	function handleClick(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		toggle(!allWatched);
	}

	const Icon = loading ? Loader2 : error ? XCircle : allWatched ? Check : Eye;

	return (
		<button
			onClick={handleClick}
			disabled={loading}
			aria-label={
				allWatched ? t.movie.markUnwatched : t.movie.markSeasonWatched
			}
			title={
				allWatched ? t.movie.markUnwatched : t.movie.markSeasonWatched
			}
			className={cn(
				'h-8 w-8 rounded-full backdrop-blur-md border',
				'flex items-center justify-center transition-all duration-(--duration-base) cursor-pointer',
				allWatched
					? 'bg-success/30 text-success border-success/30 hover:bg-red/30 hover:text-red hover:border-red/30'
					: 'bg-surface/40 text-text border-border/10 hover:bg-red/30 hover:text-red hover:border-red/30'
			)}
		>
			<Icon className={cn('h-4 w-4', loading && 'animate-spin')} />
		</button>
	);
}
