'use client';

import { Eye, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionStatusIcon } from '@/components/ui/ActionStatusIcon';
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
				'h-8 w-8 rounded-full border',
				'flex items-center justify-center transition-colors duration-(--duration-base) cursor-pointer',
				allWatched
					? 'bg-success/30 text-success border-success/30 hover:bg-red/30 hover:text-red hover:border-red/30'
					: 'bg-surface/40 text-text border-border/10 hover:bg-red/30 hover:text-red hover:border-red/30'
			)}
		>
			<ActionStatusIcon
				loading={loading}
				error={error}
				icon={allWatched ? Check : Eye}
			/>
		</button>
	);
}
