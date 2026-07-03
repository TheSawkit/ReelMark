'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Clock, Calendar, Star, X } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { formatDate, formatRuntime } from '@/lib/format';
import { EpisodeWatchButton } from '@/components/media/tv/EpisodeWatchButton';
import { ReviewsList } from '@/components/media/reviews/ReviewsList';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import type { Episode } from '@/types/tmdb';
import type { PublicReview } from '@/types/profile';

interface EpisodeCardProps {
	tvId: number;
	seasonNumber: number;
	episode: Episode;
	isWatched: boolean;
	locale: string;
	reviews?: PublicReview[];
	labels?: {
		noImage: string;
		noDescription: string;
	};
}

/**
 * Card displaying a TV episode with still image, metadata, and watch button.
 * Allows expanding description text in a modal overlay. Shows watched status visually.
 *
 * @param props - EpisodeCardProps configuration
 * @param props.tvId - TV show ID for action handlers
 * @param props.seasonNumber - Season number containing this episode
 * @param props.episode - Episode details (name, overview, rating, dates, etc.)
 * @param props.isWatched - Whether the episode has been marked as watched
 * @param props.locale - Locale string for date formatting
 * @param props.labels - Optional custom text labels for fallback messages
 * @returns Card with episode details and expandable description modal
 */
export function EpisodeCard({
	tvId,
	seasonNumber,
	episode,
	isWatched,
	locale,
	reviews,
	labels,
}: EpisodeCardProps) {
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const wasOpenRef = useRef(false);

	const handleEscape = useCallback((e: KeyboardEvent) => {
		if (e.key === 'Escape') setIsExpanded(false);
	}, []);

	const handleDialogKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key !== 'Tab' || !dialogRef.current) return;
		const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}, []);

	useEffect(() => {
		if (isExpanded) {
			wasOpenRef.current = true;
			document.addEventListener('keydown', handleEscape);
			const closeButton =
				dialogRef.current?.querySelector<HTMLButtonElement>(
					'[data-close]'
				);
			closeButton?.focus();
			return () => document.removeEventListener('keydown', handleEscape);
		}

		if (wasOpenRef.current) {
			wasOpenRef.current = false;
			triggerRef.current?.focus();
		}
	}, [isExpanded, handleEscape]);

	const noImage = labels?.noImage ?? t.movie.noImage;
	const noDescription = labels?.noDescription ?? t.movie.noDescription;

	return (
		<div
			className={cn(
				'relative flex flex-col overflow-hidden glass-overlay rounded-poster transition-all duration-(--duration-base) hover:shadow-glow-gold shadow-card group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
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
				<div className="absolute top-2 left-2 glass-overlay shadow-card-sm text-text font-bold text-sm px-2 py-1 rounded">
					E{episode.episode_number.toString().padStart(2, '0')}
				</div>
				<div
					className={cn(
						'absolute top-2 right-2 glass-overlay px-2 py-1 rounded shadow-card-sm',
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
							ref={triggerRef}
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

				<div className="mt-auto pt-4 flex items-center justify-between relative z-10">
					{reviews && reviews.length > 0 ? (
						<ReviewsList reviews={reviews} triggerOnly />
					) : (
						<div />
					)}
					<EpisodeWatchButton
						tvId={tvId}
						seasonNumber={seasonNumber}
						episodeNumber={episode.episode_number}
						initialWatched={isWatched}
						episodeId={episode.id}
						episodeName={episode.name}
						stillPath={episode.still_path}
					/>
				</div>
			</div>

			{isExpanded && (
				<div
					ref={dialogRef}
					onClick={() => setIsExpanded(false)}
					role="dialog"
					aria-modal="true"
					aria-labelledby={`episode-title-${episode.episode_number}`}
					onKeyDown={handleDialogKeyDown}
					className="absolute inset-0 z-30 glass-overlay flex flex-col p-6 animate-in fade-in duration-(--duration-base) cursor-pointer"
				>
					<div className="flex justify-between items-start mb-4 gap-4">
						<h3
							id={`episode-title-${episode.episode_number}`}
							className="text-lg font-bold text-text leading-tight"
						>
							{episode.name}
						</h3>
						<button
							data-close
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setIsExpanded(false);
							}}
							aria-label={t.common.close}
							className="h-11 w-11 flex items-center justify-center shrink-0 rounded-full bg-border-subtle hover:bg-border text-muted hover:text-text transition-colors cursor-pointer"
						>
							<X className="h-4 w-4" aria-hidden="true" />
						</button>
					</div>
					<div
						className="overflow-y-auto flex-1 pr-2 cursor-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<p className="text-sm text-text leading-relaxed cursor-text selection:bg-primary/30">
							{episode.overview || noDescription}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
