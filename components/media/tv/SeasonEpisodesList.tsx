'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { EpisodeCard } from '@/components/media/tv/EpisodeCard';
import { episodeWatchStore } from '@/lib/episode-watch-store';
import { useProgressiveReveal } from '@/hooks/useProgressiveReveal';
import { useTranslation } from '@/lib/i18n/context';
import type { Episode } from '@/types/tmdb';
import type { PublicReview } from '@/types/profile';

const EPISODES_PAGE_SIZE = 12;

interface SeasonEpisodesListProps {
	tvId: number;
	seasonNumber: number;
	episodes: Episode[];
	watchedEpisodeNumbers: number[];
	reviewsByEpisodeId: Record<number, PublicReview[]>;
	locale: string;
	labels: { noImage: string; noDescription: string };
}

/**
 * Season episodes grid revealed in blocks as the user scrolls, keeping DOM and
 * image memory bounded on long seasons.
 */
export function SeasonEpisodesList({
	tvId,
	seasonNumber,
	episodes,
	watchedEpisodeNumbers,
	reviewsByEpisodeId,
	locale,
	labels,
}: SeasonEpisodesListProps) {
	const { t } = useTranslation();
	const { visibleCount, hasMore, loaderRef } = useProgressiveReveal(
		episodes.length,
		EPISODES_PAGE_SIZE
	);
	const watched = new Set(watchedEpisodeNumbers);

	useEffect(() => {
		episodeWatchStore.seed(
			tvId,
			seasonNumber,
			watchedEpisodeNumbers.length,
			watchedEpisodeNumbers
		);
	}, [tvId, seasonNumber, watchedEpisodeNumbers]);

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{episodes.slice(0, visibleCount).map((episode) => (
					<EpisodeCard
						key={episode.id}
						tvId={tvId}
						seasonNumber={seasonNumber}
						episode={episode}
						isWatched={watched.has(episode.episode_number)}
						locale={locale}
						reviews={reviewsByEpisodeId[episode.id] ?? []}
						labels={labels}
					/>
				))}
			</div>
			<div ref={loaderRef} aria-hidden="true" />
			{hasMore && (
				<div
					className="flex justify-center py-8"
					role="status"
					aria-label={t.common.loading}
				>
					<Loader2 className="h-6 w-6 animate-spin text-muted" />
				</div>
			)}
		</>
	);
}
