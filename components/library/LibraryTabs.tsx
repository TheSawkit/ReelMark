'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/card/MediaCard';
import { BookMarked, Eye, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import type { WatchlistEntry } from '@/types/tmdb';
import { watchlistEntryToMediaItem } from '@/lib/mappers';

const PAGE_SIZE = 24;

interface LibraryTabsProps {
    toWatch: WatchlistEntry[];
    watched: WatchlistEntry[];
    tvProgress?: Record<number, { watched: number; total: number }>;
}

type Tab = 'to_watch' | 'watched';

export function LibraryTabs({
    toWatch,
    watched,
    tvProgress = {},
}: LibraryTabsProps) {
    const [activeTab, setActiveTab] = useState<Tab>('to_watch');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const { t } = useTranslation();

    const tabs: Record<
        Tab,
        { label: string; icon: typeof BookMarked; items: WatchlistEntry[] }
    > = {
        to_watch: {
            label: t.library.toWatch,
            icon: BookMarked,
            items: toWatch,
        },
        watched: { label: t.library.watched, icon: Eye, items: watched },
    };

    const current = tabs[activeTab];

    function switchTab(tab: Tab) {
        setActiveTab(tab);
        setVisibleCount(PAGE_SIZE);
    }

    return (
        <div>
            <div
                className="flex gap-2 mb-8 border-b border-border pb-0"
                role="tablist"
                aria-label={t.library.filtersLabel}
            >
                {(Object.entries(tabs) as [Tab, (typeof tabs)[Tab]][]).map(
                    ([id, tab]) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={activeTab === id}
                            aria-controls={`panel-${id}`}
                            onClick={() => switchTab(id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-(--duration-fast) ease-apple cursor-pointer',
                                'border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm',
                                activeTab === id
                                    ? 'border-primary text-text'
                                    : 'border-transparent text-muted hover:text-text hover:border-border'
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            <span
                                className={cn(
                                    'ml-1 px-1.5 py-0.5 rounded-full text-xs',
                                    activeTab === id
                                        ? 'bg-primary/20 text-text'
                                        : 'bg-surface-2 text-muted'
                                )}
                            >
                                {tab.items.length}
                            </span>
                        </button>
                    )
                )}
            </div>

            {current.items.length === 0 ? (
                <div
                    role="tabpanel"
                    id={`panel-${activeTab}`}
                    className="flex flex-col items-center justify-center py-32 animate-in fade-in slide-in-from-bottom-4 duration-(--duration-slow)"
                    style={{
                        animation:
                            'fadeIn var(--duration-medium) ease-out forwards',
                    }}
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/10 mb-6">
                        <current.icon className="h-10 w-10 text-muted/50" />
                    </div>
                    <p className="text-xl font-semibold text-text mb-2">
                        {activeTab === 'to_watch'
                            ? t.library.noMovies
                            : t.library.noWatched}
                    </p>
                    <p className="text-muted max-w-sm text-center">
                        {activeTab === 'to_watch'
                            ? t.library.noMoviesDesc
                            : t.library.noWatchedDesc}
                    </p>
                </div>
            ) : (
                <>
                    <div
                        key={activeTab}
                        role="tabpanel"
                        id={`panel-${activeTab}`}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6"
                        style={{
                            animation:
                                'scaleIn var(--duration-base) ease-out forwards',
                            opacity: 0,
                        }}
                    >
                        {current.items
                            .slice(0, visibleCount)
                            .map((entry, index) => {
                                const mediaItem =
                                    watchlistEntryToMediaItem(entry);
                                const progress =
                                    entry.media_type === 'tv'
                                        ? tvProgress[entry.media_id]
                                        : undefined;
                                return (
                                    <MediaCard
                                        key={entry.id}
                                        media={mediaItem}
                                        watchlistEntry={entry}
                                        hideRating
                                        priority={index < 6}
                                        tvProgress={progress}
                                    />
                                );
                            })}
                    </div>
                    {visibleCount < current.items.length && (
                        <div className="flex justify-center mt-10">
                            <button
                                onClick={() =>
                                    setVisibleCount((c) => c + PAGE_SIZE)
                                }
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-2 border border-border text-sm font-medium text-muted hover:text-text hover:bg-surface-3 transition-colors"
                            >
                                <ChevronDown className="h-4 w-4" />
                                {t.library.loadMore} (
                                {current.items.length - visibleCount})
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
