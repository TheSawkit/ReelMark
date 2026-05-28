'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/tmdb/images';
import type { MediaBannerProps } from '@/types/components';
import { Star, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLocale } from '@/lib/i18n/utils';
import { formatDate, formatRuntime } from '@/lib/format';
import { useDominantColor } from '@/hooks/useDominantColor';
import { NavbarGradient } from '@/components/ui/NavbarGradient';
import { mediaHeaderStore } from '@/lib/media-header-store';
/**
 * Large hero banner displaying media details with parallax backdrop.
 * Feeds title and scroll state into mediaHeaderStore for NavbarClient and MediaActionsBar.
 */
export function MediaBanner({
    title,
    tagline,
    backdropUrl,
    posterPath,
    voteAverage,
    releaseDate,
    runtime,
    certification,
    genres,
    actions,
    communityBadge,
}: MediaBannerProps) {
    const { t, lang } = useTranslation();
    const locale = getLocale(lang);
    const router = useRouter();
    const bottomRef = useRef<HTMLDivElement>(null);
    const dominantColor = useDominantColor(backdropUrl);

    useEffect(() => {
        mediaHeaderStore.setMedia(title);
        return () => mediaHeaderStore.clear();
    }, [title]);

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
            <div className="absolute inset-x-0 inset-y-0 -z-10">
                <Image
                    src={backdropUrl}
                    alt={title}
                    fill
                    style={{
                        paddingTop: 'calc(4rem + env(safe-area-inset-top))',
                    }}
                    className="pt-20 object-cover object-top"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-app-bg via-app-bg/40 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-r from-app-bg via-app-bg/40 to-transparent" />
            </div>

            <div className="relative z-10 container mx-auto px-6 lg:px-12 h-full flex flex-col justify-end pb-4 sm:pb-12">
                <div className="w-full justify-start mb-6 md:mb-8 z-20 hidden md:flex">
                    <button
                        onClick={() => router.back()}
                        aria-label={t.common.goBack}
                        className="h-11 w-11 flex items-center justify-center rounded-full bg-surface/20 backdrop-blur-2xl border border-border/10 border-t-border/20 hover:bg-surface-2/20 shrink-0 text-text transition-colors cursor-pointer shadow-card-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex flex-col md:flex-row gap-3 sm:gap-6 md:gap-8 w-full items-start md:items-end pt-4 sm:pt-10 md:pt-0">
                    <div className="relative aspect-2/3 w-20 sm:w-40 md:w-48 lg:w-56 shrink-0 rounded-lg overflow-hidden border-2 border-gold/30 shadow-poster">
                        <Image
                            src={getImageUrl(posterPath, 'w500')}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 128px, 224px"
                        />
                    </div>

                    <div className="flex-1 max-w-4xl">
                        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-4 drop-shadow-text">
                            {title}
                        </h1>

                        {tagline && (
                            <p className="text-base sm:text-xl md:text-2xl text-text-muted mb-6 italic">
                                {tagline}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-4">
                            <HeroBadge
                                icon={
                                    <Star className="h-5 w-5 fill-rating-gold text-rating-gold" />
                                }
                            >
                                <span className="font-semibold text-text">
                                    {voteAverage && voteAverage > 0
                                        ? voteAverage.toFixed(1)
                                        : t.movie.notRated}
                                </span>
                            </HeroBadge>

                            {communityBadge}

                            {releaseDate && (
                                <HeroBadge
                                    icon={
                                        <Calendar className="h-5 w-5 text-muted" />
                                    }
                                >
                                    <span className="text-text">
                                        {formatDate(releaseDate, locale)}
                                    </span>
                                </HeroBadge>
                            )}

                            {runtime && runtime > 0 && (
                                <HeroBadge
                                    icon={
                                        <Clock className="h-5 w-5 text-muted" />
                                    }
                                >
                                    <span className="text-text">
                                        {formatRuntime(runtime)}
                                    </span>
                                </HeroBadge>
                            )}

                            {certification && (
                                <HeroBadge>
                                    <span className="font-semibold text-text">
                                        {certification}
                                    </span>
                                </HeroBadge>
                            )}
                        </div>

                        {genres && genres.length > 0 && (
                            <div className="flex flex-wrap gap-2.5 mb-6">
                                {genres.map((genre) => (
                                    <span
                                        key={genre.id}
                                        className="bg-glass-bg-hover text-text px-3.5 py-1.5 rounded-full text-sm font-medium border border-glass-border-hover backdrop-blur-xl"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {actions && (
                            <div
                                ref={bottomRef}
                                className="flex flex-wrap justify-center sm:justify-normal items-center gap-3 mt-2"
                            >
                                {actions}
                            </div>
                        )}

                        {!actions && (
                            <div ref={bottomRef} className="h-1 w-full" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HeroBadge({
    children,
    icon,
}: {
    children: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 bg-glass-bg-hover backdrop-blur-2xl backdrop-saturate-150 px-4 py-2 rounded-full border border-glass-border-hover shadow-card-sm">
            {icon}
            {children}
        </div>
    );
}
