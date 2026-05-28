'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { WatchlistEntry } from '@/types/tmdb';
import type { PrivacyVisibility } from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';
import { watchlistEntryToMediaItem } from '@/lib/mappers';
import { InfiniteScrollMedia } from '@/components/media/card/InfiniteScrollMedia';
import { PrivacyBlock } from '@/components/profile/PrivacyBlock';
import { EmptyState } from '@/components/ui/EmptyState';

type MediaTypeFilter = 'all' | 'movie' | 'tv';

interface WatchlistSectionProps {
    entries: WatchlistEntry[];
    visibility: PrivacyVisibility;
    canView: boolean;
    isOwnProfile: boolean;
    sectionKey: string;
}

export function WatchlistSection({
    entries,
    visibility,
    canView,
    isOwnProfile,
    sectionKey,
}: WatchlistSectionProps) {
    const { t } = useTranslation();
    const [mediaType, setMediaType] = useState<MediaTypeFilter>('all');

    if (!canView) return <PrivacyBlock visibility={visibility} />;

    if (entries.length === 0) {
        return (
            <EmptyState
                message={t.profile.noContent}
                action={
                    isOwnProfile
                        ? { href: '/explorer', label: t.profile.exploreButton }
                        : undefined
                }
            />
        );
    }

    const movieCount = entries.filter((e) => e.media_type === 'movie').length;
    const tvCount = entries.filter((e) => e.media_type === 'tv').length;

    const FILTERS: Array<{
        id: MediaTypeFilter;
        label: string;
        count: number;
    }> = [
        { id: 'all', label: t.profile.all, count: entries.length },
        { id: 'movie', label: t.profile.movies, count: movieCount },
        { id: 'tv', label: t.profile.series, count: tvCount },
    ];

    const filtered =
        mediaType === 'all'
            ? entries
            : entries.filter((e) => e.media_type === mediaType);
    const items = filtered.map(watchlistEntryToMediaItem);
    const category = `${sectionKey}-${mediaType}`;

    return (
        <div>
            <div className="flex gap-1.5 mb-5 flex-wrap">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setMediaType(f.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer',
                            mediaType === f.id
                                ? 'bg-primary text-white'
                                : 'bg-surface-2 text-muted hover:text-text'
                        )}
                    >
                        {f.label}
                        <span
                            className={cn(
                                'text-xs px-1.5 py-0.5 rounded-full',
                                mediaType === f.id
                                    ? 'bg-white/20 text-white'
                                    : 'bg-surface-3 text-muted'
                            )}
                        >
                            {f.count}
                        </span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="text-muted text-sm py-8 text-center">
                    {mediaType === 'movie'
                        ? t.profile.noMovies
                        : t.profile.noSeries}
                </p>
            ) : (
                <InfiniteScrollMedia
                    initialItems={items.slice(0, 20)}
                    clientSideData={items}
                    category={category}
                    hideRating
                    showWatchlistMeta
                />
            )}
        </div>
    );
}
