'use client';

import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionStatusIcon } from '@/components/ui/ActionStatusIcon';
import { useSeasonWatch } from '@/lib/stores/episode-watch';
import { useTranslation } from '@/lib/i18n/context';
import { useSeasonWatchToggle } from '@/hooks/useSeasonWatchToggle';

interface SeasonWatchButtonProps {
	tvId: number;
	seasonNumber: number;
	totalEpisodes: number;
	watchedCount: number;
	variant?: 'full' | 'responsive';
}

export function SeasonWatchButton({
	tvId,
	seasonNumber,
	totalEpisodes,
	watchedCount,
	variant = 'full',
}: SeasonWatchButtonProps) {
	const { t } = useTranslation();
	const { loading, error, toggle } = useSeasonWatchToggle(
		tvId,
		seasonNumber,
		totalEpisodes
	);

	const count = useSeasonWatch(tvId, seasonNumber)?.count ?? watchedCount;
	const allWatched = count >= totalEpisodes && totalEpisodes > 0;

	const stateLabel = error
		? t.common.actionError
		: allWatched
			? `${t.movie.seasonComplete} (${count}/${totalEpisodes})`
			: `${t.movie.markAllWatched} (${count}/${totalEpisodes})`;

	if (variant === 'responsive') {
		return (
			<button
				onClick={() => toggle(!allWatched)}
				disabled={loading}
				aria-label={stateLabel}
				className={cn(
					'h-12 w-12 lg:h-auto lg:w-auto lg:min-h-11 lg:px-5 lg:py-2.5',
					'flex items-center justify-center gap-2 rounded-full text-sm font-semibold shrink-0 border',
					'transition duration-(--duration-base) focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
					allWatched
						? 'bg-primary/40 text-white border-border/10 border-t-border/20 shadow-card-sm'
						: 'bg-surface/70 text-rating-gold border-border/10 border-t-border/20 hover:bg-surface/85 hover:text-text'
				)}
			>
				<ActionStatusIcon
					loading={loading}
					error={error}
					icon={CheckCheck}
					className="h-5 w-5"
				/>
				<span className="inline max-lg:hidden">{stateLabel}</span>
			</button>
		);
	}

	return (
		<button
			onClick={() => toggle(!allWatched)}
			disabled={loading}
			className={cn(
				'flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold sm:w-auto',
				'transition active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
				allWatched
					? 'border-gold/40 bg-gold/15 text-gold'
					: 'glass-surface border-glass-border text-text hover:bg-glass-bg-hover'
			)}
		>
			<ActionStatusIcon
				loading={loading}
				error={error}
				icon={CheckCheck}
				className="h-5 w-5"
			/>
			{stateLabel}
		</button>
	);
}
