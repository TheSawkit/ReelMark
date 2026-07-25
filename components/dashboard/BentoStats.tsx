'use client';

import { Film, Tv, Bookmark, type LucideIcon } from 'lucide-react';
import { Aurora } from '@/components/effects/Aurora';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useEpisodeWatchDelta } from '@/lib/episode-watch-store';
import { useWatchStatusDelta } from '@/lib/media-watch-store';

interface BentoStatsProps {
	title: string;
	moviesWatched: number;
	episodesWatched: number;
	toWatch: number;
	labels: { movies: string; episodes: string; toWatch: string };
}

/**
 * Compact stat grid summarizing the user's watch activity. Server counts are the baseline;
 * this session's mutations are added on top so the numbers move as the user ticks episodes.
 */
export function BentoStats({
	title,
	moviesWatched,
	episodesWatched,
	toWatch,
	labels,
}: BentoStatsProps) {
	const episodesDelta = useEpisodeWatchDelta();
	const moviesDelta = useWatchStatusDelta('watched', 'movie');
	const toWatchDelta = useWatchStatusDelta('to_watch');

	const cells: { icon: LucideIcon; value: number; label: string }[] = [
		{
			icon: Film,
			value: Math.max(0, moviesWatched + moviesDelta),
			label: labels.movies,
		},
		{
			icon: Tv,
			value: Math.max(0, episodesWatched + episodesDelta),
			label: labels.episodes,
		},
		{
			icon: Bookmark,
			value: Math.max(0, toWatch + toWatchDelta),
			label: labels.toWatch,
		},
	];

	return (
		<section className="mb-10 space-y-4">
			<SectionHeading>{title}</SectionHeading>
			<div className="grid grid-cols-3 gap-3 sm:gap-4">
				{cells.map(({ icon: Icon, value, label }, i) => (
					<div
						key={label}
						className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 sm:p-5"
					>
						{i === 0 && <Aurora intensity={0.35} />}
						<div className="relative">
							<div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
								<Icon className="h-5 w-5" />
							</div>
							<div className="heading-display leading-none text-3xl text-text sm:text-4xl">
								{value}
							</div>
							<div className="mt-1.5 text-xs text-muted sm:text-sm">
								{label}
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
