"use client"

import { useState, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { SectionHeading } from "@/components/ui/SectionHeading"
import type { MediaTrailersProps } from "@/types/components"

export function MediaTrailers({ trailers }: MediaTrailersProps) {
    const { t } = useTranslation()
    const [failedKeys, setFailedKeys] = useState<Set<string>>(new Set())

    const handleIframeError = useCallback((key: string) => {
        setFailedKeys((prev) => new Set(prev).add(key))
    }, [])

    const visibleTrailers = trailers.filter((trailer) => !failedKeys.has(trailer.key))

    if (visibleTrailers.length === 0) return null

    return (
        <section className="space-y-6">
            <SectionHeading>{t.movie.trailers}</SectionHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleTrailers.slice(0, 3).map((trailer) => (
                    <TrailerEmbed
                        key={trailer.id}
                        videoKey={trailer.key}
                        title={trailer.name}
                        site={trailer.site}
                        onError={handleIframeError}
                        unsupportedLabel={t.movie.unsupportedFormat}
                    />
                ))}
            </div>
        </section>
    )
}

function TrailerEmbed({
    videoKey,
    title,
    site,
    onError,
    unsupportedLabel,
}: {
    videoKey: string
    title: string
    site: string
    onError: (key: string) => void
    unsupportedLabel: string
}) {
    if (site !== "YouTube") {
        return (
            <div className="relative aspect-video bg-surface/20 backdrop-blur-2xl rounded-xl overflow-hidden border border-border/10 border-t-border/20 shadow-card">
                <div className="w-full h-full flex items-center justify-center bg-transparent text-muted">
                    <p className="text-sm font-medium">{unsupportedLabel}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative aspect-video bg-surface/20 backdrop-blur-2xl rounded-xl overflow-hidden border border-border/10 border-t-border/20 shadow-card transition-all duration-(--duration-base) hover:shadow-glow-gold hover:border-gold/30 hover:border-t-gold/50">
            <iframe
                src={`https://www.youtube.com/embed/${videoKey}?rel=0&modestbranding=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
                onError={() => onError(videoKey)}
            />
        </div>
    )
}
