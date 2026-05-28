import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SeasonWatchButton } from '@/components/media/tv/SeasonWatchButton';
import { ProgressBar } from '@/components/shared/ProgressBar';

interface SeasonHeaderProps {
  tvId: number;
  tvName: string;
  seasonName: string;
  seasonNumber: number;
  totalEpisodes: number;
  watchedCount: number;
  labels: {
    backTo: string;
    episodes: string;
  };
}

/** Sticky sub-header for the season detail page: back link, title, watch button, progress bar. */
export function SeasonHeader({
  tvId,
  tvName,
  seasonName,
  seasonNumber,
  totalEpisodes,
  watchedCount,
  labels,
}: SeasonHeaderProps) {
  return (
    <div className="sticky top-16 z-30 w-full bg-surface/40 backdrop-blur-2xl border-b border-border/10 shadow-navbar animate-in fade-in slide-in-from-top-4 duration-(--duration-slowest)">
      <div className="container mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-1 md:space-y-2">
            <Link
              href={`/tv/${tvId}`}
              className="inline-flex items-center gap-2 text-muted hover:text-text transition-colors text-sm font-medium group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>
                {labels.backTo} {tvName}
              </span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-text tracking-tight">
              {seasonName}
            </h1>
          </div>

          <div className="flex flex-row flex-wrap items-center gap-4">
            <SeasonWatchButton
              tvId={tvId}
              seasonNumber={seasonNumber}
              totalEpisodes={totalEpisodes}
              watchedCount={watchedCount}
            />
            {watchedCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-2/10 border border-border shadow-inner">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider font-bold text-muted">
                    {watchedCount}/{totalEpisodes} {labels.episodes}
                  </span>
                  <ProgressBar
                    watched={watchedCount}
                    total={totalEpisodes}
                    className="w-24 sm:w-32 h-1 bg-border-subtle rounded-full"
                    innerClassName="bg-linear-to-r from-primary to-gold rounded-full"
                  />
                </div>
                <span className="text-sm font-bold text-text">
                  {Math.round((watchedCount / totalEpisodes) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
