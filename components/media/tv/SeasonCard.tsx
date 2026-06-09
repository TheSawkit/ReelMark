import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/tmdb/images';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { SeasonWatchIcon } from '@/components/media/tv/SeasonWatchIcon';
import { ProgressBar } from '@/components/shared/ProgressBar';
import type { Season } from '@/types/tmdb';

interface SeasonCardProps {
	tvId: number;
	season: Season;
	seasonWatched: number;
	locale: string;
	labels: {
		episodes: string;
		completed: string;
		watchedProgress: (watched: number, total: number) => React.ReactNode;
	};
}

export async function SeasonCard({
	tvId,
	season,
	seasonWatched,
	locale,
	labels,
}: SeasonCardProps) {
	const seasonTotal = season.episode_count;
	const isComplete = seasonWatched === seasonTotal && seasonTotal > 0;
	const lang = await getServerLanguage();

	return (
		<div className="relative group">
			<Link
				href={localizedHref(
					lang,
					`/tv/${tvId}/season/${season.season_number}`
				)}
				className={cn(
					'flex gap-4 bg-surface-2 rounded-xl p-4 transition-all duration-(--duration-base) hover:bg-surface-3 hover:shadow-cinema border cursor-pointer',
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

					{seasonWatched > 0 && (
						<div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-surface/80 to-transparent p-1.5">
							<ProgressBar
								watched={seasonWatched}
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
							{labels.episodes}
						</div>
						{season.air_date && (
							<div className="flex items-center gap-1.5 text-sm text-muted overflow-hidden">
								<Calendar className="h-3.5 w-3.5 shrink-0" />
								<span className="truncate">
									{formatDate(season.air_date, locale)}
								</span>
							</div>
						)}

						{seasonWatched > 0 && (
							<div
								className={cn(
									'text-xs font-medium mt-1 truncate',
									isComplete ? 'text-success' : 'text-muted'
								)}
							>
								{isComplete
									? labels.completed
									: labels.watchedProgress(
											seasonWatched,
											seasonTotal
										)}
							</div>
						)}
					</div>
				</div>
			</Link>

			<div
				className={cn(
					'absolute top-2 right-2 z-10 transition-all duration-(--duration-base)',
					seasonWatched > 0
						? 'opacity-100'
						: 'opacity-0 group-hover:opacity-100'
				)}
			>
				<SeasonWatchIcon
					tvId={tvId}
					seasonNumber={season.season_number}
					totalEpisodes={seasonTotal}
					watchedCount={seasonWatched}
					releaseDate={season.air_date ?? undefined}
				/>
			</div>
		</div>
	);
}
