'use client';

import { useState } from 'react';
import { CheckCheck, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markSeasonWatched } from '@/app/actions/episodes';
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
	const [optimistic, setOptimistic] = useState<{
		base: number;
		value: number;
	} | null>(null);
	const { loading, error, execute } = useAsyncAction();
	const { t } = useTranslation();

	const count =
		optimistic && optimistic.base === watchedCount
			? optimistic.value
			: watchedCount;
	const allWatched = count === totalEpisodes && totalEpisodes > 0;

	async function handleClick() {
		setOptimistic({
			base: watchedCount,
			value: allWatched ? 0 : totalEpisodes,
		});
		const result = await execute(() =>
			markSeasonWatched(tvId, seasonNumber, totalEpisodes)
		);
		if (result === undefined) setOptimistic(null);
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
