'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { InfoBadge, RatingBadge } from '@/components/ui/InfoBadge';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { DetailHero } from '@/components/media/detail/DetailHero';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { SeasonWatchButton } from '@/components/media/tv/SeasonWatchButton';
import { useSeasonWatch } from '@/lib/stores/episode-watch';
import { SeasonSwitcher } from '@/components/media/tv/SeasonSwitcher';
import type { SeasonOption } from '@/lib/seasons';

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
	watchNowButton?: ReactNode;
	seasons: SeasonOption[];
}

/**
 * Season hero: DetailHero whose title switches season, the show as eyebrow, episode count and
 * air year as meta, and the season's watch action plus its live progress.
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
	watchNowButton,
	seasons,
}: SeasonBannerProps) {
	const { t, lang } = useTranslation();
	const liveCount = useSeasonWatch(tvId, seasonNumber)?.count ?? watchedCount;
	const showHref = localizedHref(lang, `/tv/${tvId}`);

	return (
		<DetailHero
			title={seasonName}
			heading={
				<SeasonSwitcher
					tvId={tvId}
					current={seasonNumber}
					title={seasonName}
					seasons={seasons}
				/>
			}
			backdropUrl={backdropUrl}
			posterPath={posterPath}
			genres={genres}
			backControl={
				<Link
					href={showHref}
					aria-label={`${t.movie.backTo} ${tvName}`}
					className="h-11 w-11 flex items-center justify-center rounded-full glass-overlay hover:bg-surface-2/20 shrink-0 text-text transition-colors cursor-pointer shadow-card-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
			}
			eyebrow={
				<Link
					href={showHref}
					className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text transition-colors"
				>
					<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
					{tvName}
				</Link>
			}
			meta={
				<>
					{rating && <RatingBadge value={rating.avg.toFixed(1)} />}
					<InfoBadge icon={<Layers className="h-4 w-4 text-muted" />}>
						{episodeCount} {t.movie.episodes}
					</InfoBadge>
					{airDate && <InfoBadge>{airDate.slice(0, 4)}</InfoBadge>}
				</>
			}
			actions={
				<>
					{watchNowButton}
					<SeasonWatchButton
						tvId={tvId}
						seasonNumber={seasonNumber}
						totalEpisodes={totalEpisodes}
						watchedCount={watchedCount}
					/>
					{liveCount > 0 && (
						<div className="flex items-center gap-3 px-4 py-2 rounded-full glass-surface shadow-card-sm">
							<span className="text-xs uppercase tracking-wider font-bold text-muted">
								{liveCount}/{totalEpisodes} {t.movie.episodes}
							</span>
							<ProgressBar
								watched={liveCount}
								total={totalEpisodes}
								className="w-20 sm:w-28 h-1 bg-border-subtle rounded-full"
								innerClassName="bg-linear-to-r from-primary to-gold rounded-full"
							/>
							<span className="text-sm font-bold text-text tabular-nums">
								{Math.round((liveCount / totalEpisodes) * 100)}%
							</span>
						</div>
					)}
				</>
			}
		/>
	);
}
