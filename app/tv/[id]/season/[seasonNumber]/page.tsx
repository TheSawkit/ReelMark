import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getTvShowDetails,
  getSeasonDetails,
  getTvShowWatchProviders,
  getImageUrl,
} from '@/lib/tmdb';
import { getServerLocale, getTranslations } from '@/lib/i18n/server';
import { getSeasonEpisodeWatches } from '@/app/actions/episodes';
import {
  getSeasonAverageRating,
  getPublicEpisodeReviews,
} from '@/app/actions/reviews';
import { SeasonHeader } from '@/components/media/tv/SeasonHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CommunityRating } from '@/components/media/detail/CommunityRating';
import { WatchProviders } from '@/components/media/detail/WatchProviders';
import { EpisodeCard } from '@/components/media/tv/EpisodeCard';
import { BASE_URL } from '@/lib/metadata';

type SeasonPageParams = Promise<{ id: string; seasonNumber: string }>;
interface SeasonPageProps {
  params: SeasonPageParams;
}

export async function generateMetadata({
  params: paramsPromise,
}: SeasonPageProps): Promise<Metadata> {
  const params = await paramsPromise;
  const tvId = parseInt(params.id);
  const seasonNumber = parseInt(params.seasonNumber);

  if (isNaN(tvId) || isNaN(seasonNumber)) return { title: 'Season' };

  try {
    const [tvDetails, seasonDetails] = await Promise.all([
      getTvShowDetails(tvId),
      getSeasonDetails(tvId, seasonNumber),
    ]);
    const description =
      seasonDetails.overview || `${seasonDetails.name} of ${tvDetails.name}`;
    const posterPath = seasonDetails.poster_path ?? tvDetails.poster_path;
    const ogImage = posterPath ? getImageUrl(posterPath, 'w500') : undefined;

    return {
      title: `${seasonDetails.name} — ${tvDetails.name}`,
      description,
      alternates: {
        canonical: `${BASE_URL}/tv/${tvId}/season/${seasonNumber}`,
      },
      openGraph: {
        title: `${seasonDetails.name} — ${tvDetails.name}`,
        description,
        type: 'video.tv_show',
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${seasonDetails.name} — ${tvDetails.name}`,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
    };
  } catch {
    return { title: 'Season' };
  }
}

export default async function SeasonPage(props: SeasonPageProps) {
  const params = await props.params;
  const tvId = parseInt(params.id);
  const seasonNumber = parseInt(params.seasonNumber);

  if (isNaN(tvId) || isNaN(seasonNumber)) notFound();

  let tvDetails, seasonDetails;
  try {
    [tvDetails, seasonDetails] = await Promise.all([
      getTvShowDetails(tvId),
      getSeasonDetails(tvId, seasonNumber),
    ]);
  } catch {
    notFound();
  }

  const episodeIds = seasonDetails.episodes.map((e) => e.id);
  const [
    t,
    locale,
    watchedEpisodes,
    seasonRating,
    episodeReviews,
    watchProviders,
  ] = await Promise.all([
    getTranslations(),
    getServerLocale(),
    getSeasonEpisodeWatches(tvId, seasonNumber),
    getSeasonAverageRating(tvId, seasonNumber),
    getPublicEpisodeReviews(episodeIds),
    getTvShowWatchProviders(tvId).catch(() => null),
  ]);

  const watchedCount = watchedEpisodes.size;

  const reviewsByEpisodeId = new Map<number, typeof episodeReviews>();
  for (const review of episodeReviews) {
    const list = reviewsByEpisodeId.get(review.media_id) ?? [];
    list.push(review);
    reviewsByEpisodeId.set(review.media_id, list);
  }

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <SeasonHeader
        tvId={tvId}
        tvName={tvDetails.name}
        seasonName={seasonDetails.name}
        seasonNumber={seasonNumber}
        totalEpisodes={seasonDetails.episodes.length}
        watchedCount={watchedCount}
        labels={{ backTo: t.movie.backTo, episodes: t.movie.episodes }}
      />

      <div className="container mx-auto px-6 lg:px-12 py-10 space-y-12">
        {seasonDetails.overview && (
          <div className="max-w-4xl space-y-4">
            <SectionHeading>{t.explorer.overview}</SectionHeading>
            <p className="text-lg text-muted leading-relaxed font-light">
              {seasonDetails.overview}
            </p>
          </div>
        )}

        <WatchProviders providers={watchProviders} />

        {seasonRating && (
          <CommunityRating avg={seasonRating.avg} count={seasonRating.count} />
        )}

        <div className="w-full h-px bg-border/10 my-8" />

        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-text">
              {t.movie.episodesCapitalized}{' '}
              <span className="text-muted text-xl font-normal ml-2">
                ({seasonDetails.episodes.length})
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seasonDetails.episodes.map((episode) => (
              <EpisodeCard
                key={episode.id}
                tvId={tvId}
                seasonNumber={seasonNumber}
                episode={episode}
                isWatched={watchedEpisodes.has(episode.episode_number)}
                locale={locale}
                reviews={reviewsByEpisodeId.get(episode.id) ?? []}
                labels={{
                  noImage: t.movie.noImage,
                  noDescription: t.movie.noDescription,
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
