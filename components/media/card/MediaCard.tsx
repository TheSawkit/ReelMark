"use client"

import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/lib/tmdb/images"
import { Star, Eye, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { WatchButton } from "@/components/media/detail/WatchButton"
import { useTranslation } from "@/lib/i18n/context"
import { getLocale } from "@/lib/i18n/utils"
import { formatShortDate } from "@/lib/format"
import { getMediaHref } from "@/lib/media"
import type { MediaCardProps } from "@/types/components"
import type { WatchlistEntry } from "@/types/tmdb"

interface Props extends MediaCardProps {
    watchlistEntry?: WatchlistEntry
    hideRating?: boolean
    tvProgress?: { watched: number; total: number }
    priority?: boolean
    imageSize?: "card" | "grid"
}

/**
 * Clickable media card showing poster with hover overlays and metadata.
 * Displays rating, description/date info, and interactive WatchButton.
 * Shows progress bar for TV shows and watch status indicators.
 *
 * @param props - Props configuration
 * @param props.media - Media item details (title, poster, rating, etc.)
 * @param props.className - Additional CSS classes for styling
 * @param props.watchlistEntry - Optional watchlist data for the media item
 * @param props.hideRating - If true, hides the rating badge on card
 * @param props.tvProgress - Optional TV show progress { watched episodes, total episodes }
 * @param props.priority - If true, preloads the image (for above-the-fold cards)
 * @param props.imageSize - Layout context: "card" for horizontal scroll, "grid" for full grid
 * @returns Linked card component with media poster and overlay controls
 */
export function MediaCard({ media, className, watchlistEntry, hideRating, tvProgress, priority, imageSize = "card" }: Props) {
    const { t, lang } = useTranslation()
    const locale = getLocale(lang)

    const href = getMediaHref(media)
    const isWatched = watchlistEntry?.status === "watched"
    const resolvedStatus = media.media_type === "tv"
        ? "to_watch"
        : (watchlistEntry ? watchlistEntry.status : (media.watchlistEntry?.status ?? "to_watch"))
    const resolvedFallback = media.media_type === "movie" && (isWatched || media.watchlistEntry?.status === "watched")
        ? "to_watch"
        : undefined

    return (
        <Link
            href={href}
            className={cn(
                "group relative rounded-poster overflow-hidden bg-surface border border-card-border block focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-12",
                "transition-[transform,box-shadow,border-color] duration-(--duration-medium) ease-apple will-change-transform",
                "hover:scale-[1.03] hover:border-gold/40 hover:shadow-poster hover:z-10",
                className
            )}
        >
            <div className="relative aspect-2/3 w-full overflow-hidden rounded-poster bg-surface">
                <Image
                    src={getImageUrl(media.poster_path, imageSize === "grid" ? "w342" : "w185")}
                    alt={media.title}
                    fill
                    loading={priority ? "eager" : "lazy"}
                    {...(priority ? { priority: true } : {})}
                    className="object-cover transition-transform duration-(--duration-base) ease-out group-hover:scale-105"
                    sizes={imageSize === "grid"
                        ? "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                        : "200px"
                    }
                />

                <div className={cn(
                    "absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-(--duration-base)",
                    "opacity-0 group-hover:opacity-100",
                )} />

                {tvProgress && tvProgress.total > 0 && (
                    <div className="absolute bottom-0 inset-x-0 z-20">
                        <div className="w-full h-1 bg-surface/10">
                            <div
                                className={cn(
                                    "h-full transition-all duration-(--duration-slow)",
                                    tvProgress.watched === tvProgress.total
                                        ? "bg-success"
                                        : "bg-linear-to-r from-primary to-gold"
                                )}
                                style={{ width: `${Math.min(100, Math.round((tvProgress.watched / tvProgress.total) * 100))}%` }}
                            />
                        </div>
                    </div>
                )}

                {!hideRating && (
                    <div className={cn(
                        "absolute top-3 right-3 z-10 transition-all duration-(--duration-base) pointer-events-none",
                        "translate-y-0 group-hover:-translate-y-1",
                    )}>
                        <div className="flex items-center gap-1.5 rounded-md bg-poster-overlay px-2 py-1 text-xs font-mono font-bold text-gold-bright backdrop-blur-md border border-white/10 shadow-card-sm transition-colors group-hover:bg-poster-overlay-heavy">
                            <Star className="h-3 w-3 fill-current drop-shadow-text" aria-hidden="true" />
                            <span className="drop-shadow-text">
                                {media.vote_average > 0 ? media.vote_average.toFixed(1) : t.movie.notRated}
                            </span>
                        </div>
                    </div>
                )}

                <div className={cn(
                    "absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 transition-all duration-(--duration-base) z-10",
                    "translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
                )}>
                    <div>
                        <h3 className="text-lg font-bold text-white/80 leading-tight line-clamp-2">
                            {media.title}
                        </h3>

                        {media.character && (
                            <p className="mt-0.5 text-xs font-bold text-gold line-clamp-1">
                                {media.character}
                            </p>
                        )}

                        {watchlistEntry ? (
                            <div className="flex items-center gap-1.5 mt-1">
                                {media.media_type === "tv" ? (
                                    <Clock className="h-3 w-3 text-white/80 shrink-0" />
                                ) : isWatched ? (
                                    <Eye className="h-3 w-3 text-white/80 shrink-0" />
                                ) : (
                                    <Clock className="h-3 w-3 text-white/80 shrink-0" />
                                )}
                                <span className="text-xs text-white/60 leading-tight">
                                    {media.media_type === "tv"
                                        ? t.movie.startedOn
                                        : (isWatched ? t.movie.watchedOn : t.movie.addedOn)}{" "}
                                    {formatShortDate(watchlistEntry.created_at, locale)}
                                </span>
                            </div>
                        ) : (
                            <p className="mt-1 text-xs text-white/80 line-clamp-2">
                                {media.overview || t.movie.noDescription}
                            </p>
                        )}
                    </div>

                    <WatchButton
                        mediaId={watchlistEntry?.media_id ?? media.id}
                        mediaTitle={watchlistEntry?.media_title ?? media.title}
                        mediaType={watchlistEntry?.media_type ?? media.media_type}
                        posterPath={watchlistEntry?.poster_path ?? media.poster_path}
                        status={resolvedStatus}
                        initialIsActive={!!watchlistEntry || !!media.watchlistEntry}
                        fallbackStatus={resolvedFallback}
                        variant="full"
                        onDark
                    />
                </div>
            </div>
        </Link>
    )
}
