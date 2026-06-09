'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Layers } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { InfoBadge, RatingBadge } from '@/components/ui/InfoBadge';
import { useTranslation } from '@/lib/i18n/context';
import { getLocale, localizedHref } from '@/lib/i18n/utils';
import { formatDate } from '@/lib/format';
import { useDominantColor } from '@/hooks/useDominantColor';
import { NavbarGradient } from '@/components/navigation/NavbarGradient';
import { CinematicBackdrop } from '@/components/media/detail/CinematicBackdrop';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { SeasonWatchButton } from '@/components/media/tv/SeasonWatchButton';
import { mediaHeaderStore } from '@/lib/media-header-store';

interface SeasonBannerProps {
	tvId: number;
	tvName: string;
	seasonName: string;
	seasonNumber: number;
	backdropUrl: string;
	posterPath: string | null;
	airDate: string | null;
	episodeCount: number;
	watchedCount: number;
	totalEpisodes: number;
	genres: { id: number; name: string }[];
	rating: { avg: number; count: number } | null;
}

/**
 * Cinematic season hero, mirroring MediaBanner: show backdrop + season poster,
 * title, badges, progress and watch action. Feeds mediaHeaderStore for the navbar.
 */
export function SeasonBanner({
	tvId,
	tvName,
	seasonName,
	seasonNumber,
	backdropUrl,
	posterPath,
	airDate,
	episodeCount,
	watchedCount,
	totalEpisodes,
	genres,
	rating,
}: SeasonBannerProps) {
	const { t, lang } = useTranslation();
	const locale = getLocale(lang);
	const dominantColor = useDominantColor(backdropUrl);
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		mediaHeaderStore.setMedia(seasonName);
		return () => mediaHeaderStore.clear();
	}, [seasonName]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					mediaHeaderStore.setScrolled(false);
				} else if (window.scrollY > 0) {
					mediaHeaderStore.setScrolled(true);
				}
			},
			{ threshold: 0, rootMargin: '-64px 0px 0px 0px' }
		);
		const el = bottomRef.current;
		if (el) observer.observe(el);
		return () => {
			if (el) observer.unobserve(el);
		};
	}, []);

	return (
		<div
			className="relative w-full -mt-16 min-h-[70vh] md:min-h-[80vh] flex flex-col justify-end pt-20 sm:pt-32 pb-6 sm:pb-12 overflow-hidden"
			style={{
				marginTop: 'calc(-4rem - env(safe-area-inset-top))',
				paddingTop: 'calc(5rem + env(safe-area-inset-top))',
			}}
		>
			<NavbarGradient color={dominantColor} />
			<CinematicBackdrop src={backdropUrl} alt={seasonName} />

			<div className="relative z-10 container mx-auto px-6 lg:px-12 h-full flex flex-col justify-end pb-4 sm:pb-12">
				<div className="w-full justify-start mb-6 md:mb-8 z-20 hidden md:flex">
					<Link
						href={localizedHref(lang, `/tv/${tvId}`)}
						aria-label={`${t.movie.backTo} ${tvName}`}
						className="h-11 w-11 flex items-center justify-center rounded-full glass-overlay hover:bg-surface-2/20 shrink-0 text-text transition-colors cursor-pointer shadow-card-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
					>
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</div>

				<div className="flex flex-col md:flex-row gap-3 sm:gap-6 md:gap-8 w-full items-start md:items-end pt-4 sm:pt-10 md:pt-0">
					<div className="relative aspect-2/3 w-20 sm:w-40 md:w-48 lg:w-56 shrink-0 rounded-lg overflow-hidden border-2 border-gold/30 shadow-poster">
						<Image
							src={getImageUrl(posterPath, 'w500')}
							alt={seasonName}
							fill
							className="object-cover"
							sizes="(max-width: 768px) 128px, 224px"
						/>
					</div>

					<div className="flex-1 max-w-4xl">
						<Link
							href={localizedHref(lang, `/tv/${tvId}`)}
							className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text transition-colors mb-2"
						>
							<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
							{tvName}
						</Link>

						<h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-4 drop-shadow-text">
							{seasonName}
						</h1>

						<div className="flex flex-wrap items-center gap-4 md:gap-6 mb-4">
							{rating && (
								<RatingBadge value={rating.avg.toFixed(1)} />
							)}
							<InfoBadge
								icon={<Layers className="h-5 w-5 text-muted" />}
							>
								<span className="text-text">
									{episodeCount} {t.movie.episodes}
								</span>
							</InfoBadge>
							{airDate && (
								<InfoBadge
									icon={
										<Calendar className="h-5 w-5 text-muted" />
									}
								>
									<span className="text-text">
										{formatDate(airDate, locale)}
									</span>
								</InfoBadge>
							)}
						</div>

						{genres.length > 0 && (
							<div className="flex flex-wrap gap-2.5 mb-6">
								{genres.map((genre) => (
									<span
										key={genre.id}
										className="glass-surface text-text px-3.5 py-1.5 rounded-full text-sm font-medium"
									>
										{genre.name}
									</span>
								))}
							</div>
						)}

						<div
							ref={bottomRef}
							className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2"
						>
							<SeasonWatchButton
								tvId={tvId}
								seasonNumber={seasonNumber}
								totalEpisodes={totalEpisodes}
								watchedCount={watchedCount}
							/>
							{watchedCount > 0 && (
								<div className="flex items-center gap-3 px-4 py-2 rounded-full glass-surface shadow-card-sm">
									<span className="text-xs uppercase tracking-wider font-bold text-muted">
										{watchedCount}/{totalEpisodes}{' '}
										{t.movie.episodes}
									</span>
									<ProgressBar
										watched={watchedCount}
										total={totalEpisodes}
										className="w-20 sm:w-28 h-1 bg-border-subtle rounded-full"
										innerClassName="bg-linear-to-r from-primary to-gold rounded-full"
									/>
									<span className="text-sm font-bold text-text tabular-nums">
										{Math.round(
											(watchedCount / totalEpisodes) * 100
										)}
										%
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
