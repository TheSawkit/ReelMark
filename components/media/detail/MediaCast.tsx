"use client"

import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/lib/tmdb/images"
import { HorizontalScroll } from "@/components/shared/HorizontalScroll"
import { SectionHeading } from "@/components/ui/SectionHeading"
import { StaggeredItem } from "@/components/ui/StaggeredItem"
import { useTranslation } from "@/lib/i18n/context"
import type { MediaCastProps } from "@/types/components"

export function MediaCast({ cast }: MediaCastProps) {
    const { t } = useTranslation()

    if (cast.length === 0) return null

    return (
        <section className="space-y-6">
            <HorizontalScroll
                title={<SectionHeading>{t.movie.castTitle}</SectionHeading>}
                scrollAmount={300}
            >
                {cast.map((actor, index) => (
                    <StaggeredItem
                        key={actor.id}
                        index={index}
                        staggerMs={30}
                        className="flex-none w-32 md:w-36 snap-start"
                    >
                    <Link
                        href={`/actor/${actor.id}`}
                        className="flex flex-col items-center text-center space-y-2 group w-full"
                    >
                        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-surface/20 backdrop-blur-2xl border border-border/10 border-t-border/20 shadow-card-sm group-hover:scale-105 group-hover:border-gold/30 group-hover:border-t-gold/50 group-hover:shadow-glow-gold transition-all duration-(--duration-base)">
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                                <Image
                                    src={getImageUrl(actor.profile_path)}
                                    alt={actor.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 112px, 128px"
                                />
                            </div>
                        </div>
                        <div className="space-y-1 w-full">
                            <p className="font-semibold text-text text-sm md:text-base line-clamp-2 group-hover:text-gold transition-colors">
                                {actor.name}
                            </p>
                            <p className="text-xs md:text-sm text-muted line-clamp-2">
                                {actor.character}
                            </p>
                        </div>
                    </Link>
                    </StaggeredItem>
                ))}
            </HorizontalScroll>
        </section>
    )
}
