import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import { getImageUrl, getMovieDetails, getMovieCredits, getMovieVideos, getMovieImages, selectHeroImage, getMovieWatchProviders } from "@/lib/tmdb"
import { MediaBanner } from "@/components/media/MediaBanner"
import { MediaTrailers } from "@/components/media/MediaTrailers"
import { MediaDescription } from "@/components/media/MediaDescription"
import { MediaCast } from "@/components/media/MediaCast"
import { WatchButton } from "@/components/media/WatchButton"
import { getMediaWatchlistEntry } from "@/app/actions/watchlist"
import { getAverageRating } from "@/app/actions/reviews"
import { filterAvailableVideos } from "@/lib/youtube"
import { Eye } from "lucide-react"
import { getTranslations, getServerLocale } from "@/lib/i18n/server"
import { buildMediaMetadata, BASE_URL } from "@/lib/metadata"
import { formatDate } from "@/lib/format"
import { CommunityRating } from "@/components/media/CommunityRating"
import { PublicReviewsSection } from "@/components/media/PublicReviewsSection"
import { WatchProviders } from "@/components/media/WatchProviders"
import { MediaActionsBar } from "@/components/media/MediaActionsBar"
import type { MoviePageProps } from "@/types/pages"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const movieId = parseInt(id)
  const t = await getTranslations()

  if (isNaN(movieId)) return { title: "ReelMark", description: t.metadata.defaultMovieDescription }

  try {
    const movieDetails = await getMovieDetails(movieId)
    const description = movieDetails.overview || t.metadata.watchMovieOn.replace("${title}", movieDetails.title)
    return buildMediaMetadata({
      title: movieDetails.title,
      description,
      backdropPath: movieDetails.backdrop_path,
      canonical: `${BASE_URL}/movie/${movieId}`,
      ogType: "video.movie",
    })
  } catch {
    return { title: "ReelMark", description: t.metadata.defaultMovieDescription }
  }
}

export default async function MoviePage(props: MoviePageProps) {
  const params = await props.params
  const movieId = parseInt(params.id)

  if (isNaN(movieId)) {
    notFound()
  }

  let movieDetails, credits, videos, images
  try {
    [movieDetails, credits, videos, images] = await Promise.all([
      getMovieDetails(movieId),
      getMovieCredits(movieId),
      getMovieVideos(movieId),
      getMovieImages(movieId),
    ])
  } catch {
    notFound()
  }

  const candidateTrailers = videos
    .filter((video) => video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser"))
    .sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0))

  const [trailers, watchProviders, watchlistEntry, movieRating, t, locale] = await Promise.all([
    filterAvailableVideos(candidateTrailers),
    getMovieWatchProviders(movieId).catch(() => null),
    getMediaWatchlistEntry(movieId, "movie"),
    getAverageRating(movieId, "movie"),
    getTranslations(),
    getServerLocale(),
  ])

  const heroImagePath = selectHeroImage(images, movieDetails.backdrop_path)
  const heroImageUrl = getImageUrl(heroImagePath, "original")
  const isWatched = watchlistEntry?.status === "watched"

  return (
    <div className="min-h-screen">
      <MediaBanner
        title={movieDetails.title}
        tagline={movieDetails.tagline}
        backdropUrl={heroImageUrl}
        posterPath={movieDetails.poster_path}
        voteAverage={movieDetails.vote_average}
        releaseDate={movieDetails.release_date}
        runtime={movieDetails.runtime}
        certification={movieDetails.certification}
        genres={movieDetails.genres}
        actions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!isWatched && (
              <div className="w-full sm:w-auto">
                <WatchButton
                  mediaId={movieDetails.id}
                  mediaTitle={movieDetails.title}
                  mediaType="movie"
                  posterPath={movieDetails.poster_path}
                  status="to_watch"
                  variant="full"
                  initialActive={watchlistEntry?.status === "to_watch"}
                />
              </div>
            )}
            <div className="w-full sm:w-auto">
              <WatchButton
                mediaId={movieDetails.id}
                mediaTitle={movieDetails.title}
                mediaType="movie"
                posterPath={movieDetails.poster_path}
                status="watched"
                variant="full"
                initialActive={isWatched}
                fallbackStatus="to_watch"
                releaseDate={movieDetails.release_date}
              />
            </div>
            {isWatched && watchlistEntry?.created_at && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface-2 border border-border text-muted animate-in fade-in slide-in-from-left-4 duration-(--duration-slow)">
                <Eye className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">
                  {t.movie.watchedOn} {formatDate(watchlistEntry.created_at, locale)}
                </span>
              </div>
            )}
          </div>
        }
      />

      <MediaActionsBar>
        {!isWatched && (
          <WatchButton
            mediaId={movieDetails.id}
            mediaTitle={movieDetails.title}
            mediaType="movie"
            posterPath={movieDetails.poster_path}
            status="to_watch"
            variant="responsive"
            initialActive={watchlistEntry?.status === "to_watch"}
          />
        )}
        <WatchButton
          mediaId={movieDetails.id}
          mediaTitle={movieDetails.title}
          mediaType="movie"
          posterPath={movieDetails.poster_path}
          status="watched"
          variant="responsive"
          initialActive={isWatched}
          fallbackStatus="to_watch"
          releaseDate={movieDetails.release_date}
        />
      </MediaActionsBar>

      <div className="container mx-auto px-6 lg:px-12 py-12 md:py-16 space-y-14 md:space-y-16">
        <MediaDescription description={movieDetails.overview} />

        <WatchProviders providers={watchProviders} />

        {movieRating && <CommunityRating avg={movieRating.avg} count={movieRating.count} />}

        <Suspense fallback={<div className="h-32 rounded-xl bg-surface/20 animate-pulse" />}>
          <PublicReviewsSection mediaId={movieId} mediaType="movie" />
        </Suspense>

        {trailers.length > 0 && <MediaTrailers trailers={trailers} />}

        <MediaCast cast={credits.cast.slice(0, 30)} />
      </div>
    </div>
  )
}
