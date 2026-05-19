"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Film, Tv } from "lucide-react"
import type { ActorFilmographyProps } from "@/types/components"
import { InfiniteScrollMedia } from "@/components/media/card/InfiniteScrollMedia"
import { useTranslation } from "@/lib/i18n/context"
import type { MediaItem } from "@/types/tmdb"

export function ActorFilmography({ movies, tvShows }: ActorFilmographyProps) {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies")

    const sortedMovies: MediaItem[] = useMemo(() => {
        const seen = new Set<number>()
        return [...movies]
            .filter((m) => m.poster_path)
            .filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true })
            .sort((a, b) => b.popularity - a.popularity)
    }, [movies])

    const sortedTvShows: MediaItem[] = useMemo(() => {
        const seen = new Set<number>()
        return [...tvShows]
            .filter((s) => s.poster_path)
            .filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true })
            .sort((a, b) => b.popularity - a.popularity)
    }, [tvShows])

    const hasMovies = sortedMovies.length > 0
    const hasTvShows = sortedTvShows.length > 0

    if (!hasMovies && !hasTvShows) {
        return null
    }

    return (
        <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-text">{t.movie.filmography}</h2>

            {hasMovies && hasTvShows && (
                <div className="flex gap-2">
                    <TabButton
                        active={activeTab === "movies"}
                        onClick={() => setActiveTab("movies")}
                        icon={<Film className="h-4 w-4" />}
                        label={`${t.movie.films} (${sortedMovies.length})`}
                    />
                    <TabButton
                        active={activeTab === "tv"}
                        onClick={() => setActiveTab("tv")}
                        icon={<Tv className="h-4 w-4" />}
                        label={`${t.movie.series} (${sortedTvShows.length})`}
                    />
                </div>
            )}

            {activeTab === "movies" && hasMovies && (
                <InfiniteScrollMedia
                    initialItems={sortedMovies.slice(0, 20)}
                    category="movie"
                    clientSideData={sortedMovies}
                />
            )}
            {activeTab === "tv" && hasTvShows && (
                <InfiniteScrollMedia
                    initialItems={sortedTvShows.slice(0, 20)}
                    category="tv"
                    clientSideData={sortedTvShows}
                />
            )}
        </section>
    )
}

function TabButton({ active, onClick, icon, label }: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
}) {
    return (
        <Button
            variant={active ? "default" : "outline"}
            className={`gap-2 cursor-pointer ${active
                ? "bg-primary hover:bg-primary-hover text-white border-none"
                : "bg-surface-2 text-muted hover:text-text hover:bg-surface border-border/20"
                }`}
            onClick={onClick}
        >
            {icon}
            {label}
        </Button>
    )
}
