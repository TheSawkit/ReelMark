'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/tmdb/images';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { episodeWatchStore, useSeasonWatch } from '@/lib/episode-watch-store';
import { SeasonWatchIcon } from '@/components/media/tv/SeasonWatchIcon';
import { ProgressBar } from '@/components/shared/ProgressBar';
import type { Season } from '@/types/tmdb';

interface SeasonCardProps {
	tvId: number;
	season: Season;
	seasonWatched: number;
	locale: string;
}

export function SeasonCard({
	tvId,
	season,
	seasonWatched,
	locale,
}: SeasonCardProps) {
	const { t, lang } = useTranslation();
	const seasonTotal = season.episode_count;

	useEffect(() => {
		episodeWatchStore.seed(tvId, season.season_number, seasonWatched);
	}, [tvId, season.season_number, seasonWatched]);

	const watched =
		useSeasonWatch(tvId, season.season_number)?.count ?? seasonWatched;
	const isComplete = watched >= seasonTotal && seasonTotal > 0;

	return (
		<div className="relative group">
			<Link
				href={localizedHref(
					lang,
					`/tv/${tvId}/season/${season.season_number}`
				)}
				className={cn(
					'flex gap-4 bg-surface-2 rounded-xl p-4 transition-colors duration-(--duration-base) hover:bg-surface-3 hover:shadow-card-lift border cursor-pointer',
					isComplete
						? 'border-success/30'
						: 'border-border/10 hover:border-primary/30'
				)}
			>
				<div className="relative w-24 h-36 shrink-0 rounded-lg overflow-hidden bg-surface flex-none">
					{season.poster_path ? (
						<Image
							src={getImageUrl(season.poster_path, 'w342')}
							alt={season.name}
							fill
							unoptimized
							className="object-cover group-hover:scale-105 transition-transform duration-(--duration-slow)"
							sizes="96px"
						/>
					) : (
						<div className="w-full h-full flex flex-col items-center justify-center text-muted bg-surface">
							<span className="text-xs font-semibold text-center px-1">
								{season.name}
							</span>
						</div>
					)}

					{watched > 0 && (
						<div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-surface/80 to-transparent p-1.5">
							<ProgressBar
								watched={watched}
								total={seasonTotal}
								className="h-1 bg-border-subtle rounded-full"
								innerClassName={
									isComplete
										? 'bg-success'
										: 'bg-linear-to-r from-primary to-gold rounded-full'
								}
							/>
						</div>
					)}
				</div>

				<div className="flex flex-col flex-1 py-1 min-w-0">
					<h3 className="text-lg font-bold text-text group-hover:text-primary transition-colors line-clamp-2">
						{season.name}
					</h3>
					<div className="flex flex-col gap-1 mt-auto">
						<div className="flex items-center gap-1.5 text-sm text-muted">
							<span className="font-semibold text-text">
								{seasonTotal}
							</span>{' '}
							{t.movie.episodes}
						</div>
						{season.air_date && (
							<div className="flex items-center gap-1.5 text-sm text-muted overflow-hidden">
								<Calendar className="h-3.5 w-3.5 shrink-0" />
								<span className="truncate">
									{formatDate(season.air_date, locale)}
								</span>
							</div>
						)}

						{watched > 0 && (
							<div
								className={cn(
									'text-xs font-medium mt-1 truncate',
									isComplete ? 'text-success' : 'text-muted'
								)}
							>
								{isComplete
									? `✓ ${t.movie.completed}`
									: `${watched}/${seasonTotal} ${t.movie.watchedCount}`}
							</div>
						)}
					</div>
				</div>
			</Link>

			<div
				className={cn(
					'absolute top-2 right-2 z-10 transition-all duration-(--duration-base)',
					watched > 0
						? 'opacity-100'
						: cn(
								'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
								// Sur tactile `hover:` ne se déclenche pas : l'icône y reste visible
								// et active, sinon elle serait tapable à l'aveugle ou inatteignable.
								'pointer-coarse:opacity-100 pointer-coarse:pointer-events-auto'
							)
				)}
			>
				<SeasonWatchIcon
					tvId={tvId}
					seasonNumber={season.season_number}
					totalEpisodes={seasonTotal}
					watchedCount={watched}
					releaseDate={season.air_date ?? undefined}
				/>
			</div>
		</div>
	);
}
