import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import { getImageUrl, getMovieDetails, getMovieCredits, getMovieVideos, getMovieImages, selectHeroImage, getMovieWatchProviders } from "@/lib/tmdb"
import { MediaBanner } from "@/components/media/detail/MediaBanner"
import { WatchButton } from "@/components/media/detail/WatchButton"
import { MediaDetailLayout } from "@/components/media/detail/MediaDetailLayout"
import { PublicReviewsSection } from "@/components/media/reviews/PublicReviewsSection"
import { getMediaWatchlistEntry } from "@/app/actions/watchlist"
import { getAverageRating } from "@/app/actions/reviews"
import { filterTrailers, buildMediaDetailMetadata } from "@/lib/media-detail"
import { filterAvailableVideos } from "@/lib/youtube"
import { Eye } from "lucide-react"
import { getTranslations, getServerLocale } from "@/lib/i18n/server"
import { formatDate } from "@/lib/format"
type MoviePageParams = Promise<{ id: string }>
interface MoviePageProps { params: MoviePageParams }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const movieId = parseInt(id)
    if (isNaN(movieId)) return { title: "ReelMark" }
    return buildMediaDetailMetadata("movie", movieId)
}

export default async function MoviePage(props: MoviePageProps) {
    const params = await props.params
    const movieId = parseInt(params.id)

    if (isNaN(movieId)) notFound()

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

    const [trailers, watchProviders, watchlistEntry, movieRating, t, locale] = await Promise.all([
        filterAvailableVideos(filterTrailers(videos)),
        getMovieWatchProviders(movieId).catch(() => null),
        getMediaWatchlistEntry(movieId, "movie"),
        getAverageRating(movieId, "movie"),
        getTranslations(),
        getServerLocale(),
    ])

    const heroImageUrl = getImageUrl(selectHeroImage(images, movieDetails.backdrop_path), "original")
    const isWatched = watchlistEntry?.status === "watched"

    const banner = (
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
                        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface/30 backdrop-blur-md border border-border/10 text-muted animate-in fade-in slide-in-from-left-4 duration-(--duration-slow)">
                            <Eye className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium">
                                {t.movie.watchedOn} {formatDate(watchlistEntry.created_at, locale)}
                            </span>
                        </div>
                    )}
                </div>
            }
        />
    )

    const actionsBar = (
        <>
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
        </>
    )

    return (
        <MediaDetailLayout
            banner={banner}
            actionsBar={actionsBar}
            description={movieDetails.overview}
            watchProviders={watchProviders}
            rating={movieRating}
            reviews={
                <Suspense fallback={<div className="h-32 rounded-xl bg-surface/20 animate-pulse" />}>
                    <PublicReviewsSection mediaId={movieId} mediaType="movie" />
                </Suspense>
            }
            trailers={trailers}
            cast={credits.cast}
        />
    )
}
