'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Clock, Calendar, Star } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { formatDate, formatRuntime } from '@/lib/format';
import { EpisodeWatchButton } from '@/components/media/tv/EpisodeWatchButton';
import { EpisodeRating } from '@/components/media/tv/EpisodeRating';
import { ReviewsList } from '@/components/media/reviews/ReviewsList';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import type { Episode } from '@/types/tmdb';
import type { PublicReview, Review } from '@/types/profile';

interface EpisodeCardProps {
	tvId: number;
	seasonNumber: number;
	episode: Episode;
	totalEpisodes: number;
	isWatched: boolean;
	locale: string;
	myReview?: Review | null;
	reviews?: PublicReview[];
	labels?: {
		noImage: string;
		noDescription: string;
	};
}

/**
 * Card displaying a TV episode with still image, metadata, watch button and — once
 * watched — an inline star rating. Long descriptions open in a dialog.
 *
 * @param props - EpisodeCardProps configuration
 * @param props.tvId - TV show ID for action handlers
 * @param props.seasonNumber - Season number containing this episode
 * @param props.episode - Episode details (name, overview, rating, dates, etc.)
 * @param props.totalEpisodes - Episode count of the season, for the catch-up prompt
 * @param props.isWatched - Whether the episode has been marked as watched
 * @param props.locale - Locale string for date formatting
 * @param props.myReview - The viewer's own review of this episode, if any
 * @param props.labels - Optional custom text labels for fallback messages
 * @returns Card with episode details and expandable description dialog
 */
export function EpisodeCard({
	tvId,
	seasonNumber,
	episode,
	totalEpisodes,
	isWatched,
	locale,
	myReview,
	reviews,
	labels,
}: EpisodeCardProps) {
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);

	const noImage = labels?.noImage ?? t.movie.noImage;
	const noDescription = labels?.noDescription ?? t.movie.noDescription;

	return (
		<div
			className={cn(
				'relative flex flex-col overflow-hidden bg-surface-2 border border-border rounded-poster transition-colors duration-(--duration-base) hover:shadow-glow-gold shadow-card group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
				isWatched
					? 'border-primary/40'
					: 'hover:border-gold/40 hover:border-t-gold/60'
			)}
		>
			<div className="relative aspect-video w-full bg-background overflow-hidden">
				{episode.still_path ? (
					<Image
						src={getImageUrl(episode.still_path, 'w780')}
						alt={episode.name}
						fill
						unoptimized
						className="object-cover group-hover:scale-105 transition-transform duration-(--duration-slow)"
					/>
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center text-muted">
						<span className="text-sm">{noImage}</span>
					</div>
				)}
				<div className="absolute top-2 left-2 bg-poster-overlay-heavy border border-white/10 shadow-card-sm text-text font-bold text-sm px-2 py-1 rounded">
					E{episode.episode_number.toString().padStart(2, '0')}
				</div>
				<div
					className={cn(
						'absolute top-2 right-2 bg-poster-overlay-heavy border border-white/10 px-2 py-1 rounded shadow-card-sm',
						'flex items-center gap-1 text-xs font-bold text-gold'
					)}
				>
					<Star className="h-3 w-3 fill-current" aria-hidden="true" />
					<span>{(episode.vote_average || 0).toFixed(1)}</span>
				</div>
			</div>

			<div className="p-4 flex flex-col flex-1">
				<h3 className="text-lg font-bold text-text mb-2 line-clamp-1">
					{episode.name}
				</h3>
				<div className="flex items-center gap-4 text-xs text-muted mb-3 font-medium">
					{episode.air_date && (
						<span className="flex items-center gap-1.5">
							<Calendar
								className="w-3.5 h-3.5"
								aria-hidden="true"
							/>
							{formatDate(episode.air_date, locale)}
						</span>
					)}
					{episode.runtime && episode.runtime > 0 ? (
						<span className="flex items-center gap-1.5">
							<Clock className="w-3.5 h-3.5" aria-hidden="true" />
							{formatRuntime(episode.runtime)}
						</span>
					) : null}
				</div>

				<div className="flex flex-col gap-1">
					<p className="text-sm text-muted leading-relaxed line-clamp-3">
						{episode.overview || noDescription}
					</p>
					{episode.overview && episode.overview.length > 120 && (
						<button
							onClick={(e) => {
								e.preventDefault();
								setIsExpanded(true);
							}}
							className="text-text text-xs font-semibold self-start hover:text-primary transition-colors cursor-pointer mt-1"
						>
							{t.movie.readMore}
						</button>
					)}
				</div>

				<div className="mt-auto pt-4 flex flex-col gap-3 relative z-10">
					<EpisodeRating
						tvId={tvId}
						seasonNumber={seasonNumber}
						episodeNumber={episode.episode_number}
						episodeId={episode.id}
						episodeName={episode.name}
						stillPath={episode.still_path}
						initialWatched={isWatched}
						initialReview={myReview ?? null}
					/>
					<div className="flex items-center justify-between gap-2">
						{reviews && reviews.length > 0 ? (
							<ReviewsList reviews={reviews} triggerOnly />
						) : (
							<div />
						)}
						<EpisodeWatchButton
							tvId={tvId}
							seasonNumber={seasonNumber}
							episodeNumber={episode.episode_number}
							totalEpisodes={totalEpisodes}
							initialWatched={isWatched}
						/>
					</div>
				</div>
			</div>

			<Dialog open={isExpanded} onOpenChange={setIsExpanded}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{episode.name}</DialogTitle>
					</DialogHeader>
					<div className="px-5 py-5 overflow-y-auto">
						<DialogDescription className="text-sm text-text leading-relaxed">
							{episode.overview || noDescription}
						</DialogDescription>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
