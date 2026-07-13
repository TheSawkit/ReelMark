'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MediaCard } from '@/components/media/card/MediaCard';
import { VirtualMediaGrid } from '@/components/media/card/VirtualMediaGrid';
import { MediaListControls } from '@/components/media/list/MediaListControls';
import { BookMarked, Eye } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import type { GridColumns } from '@/hooks/useGridColumns';
import type { MediaItem, WatchlistEntry } from '@/types/tmdb';
import { watchlistEntryToMediaItem } from '@/lib/mappers';
import { getMediaKey } from '@/lib/media';
import { useMediaListControls } from '@/hooks/useMediaListControls';

const LIBRARY_COLUMNS: GridColumns = { base: 2, sm: 3, md: 4, lg: 5, xl: 6 };
const LIBRARY_ROW_CLASS =
	'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 pb-3 sm:pb-4 md:pb-6';

interface LibraryTabsProps {
	toWatch: WatchlistEntry[];
	watched: WatchlistEntry[];
	tvProgress?: Record<number, { watched: number; total: number }>;
	genreNames: Record<number, string>;
	ratingByKey: Record<string, number>;
}

type Tab = 'to_watch' | 'watched';

function toItems(
	entries: WatchlistEntry[],
	ratingByKey: Record<string, number>
): MediaItem[] {
	return entries.map((entry) => {
		const item = watchlistEntryToMediaItem(entry);
		return { ...item, userRating: ratingByKey[getMediaKey(item)] ?? null };
	});
}

export function LibraryTabs({
	toWatch,
	watched,
	tvProgress = {},
	genreNames,
	ratingByKey,
}: LibraryTabsProps) {
	const [activeTab, setActiveTab] = useState<Tab>('to_watch');
	const { t } = useTranslation();

	const toWatchItems = useMemo(
		() => toItems(toWatch, ratingByKey),
		[toWatch, ratingByKey]
	);
	const watchedItems = useMemo(
		() => toItems(watched, ratingByKey),
		[watched, ratingByKey]
	);

	const tabs: Record<
		Tab,
		{ label: string; icon: typeof BookMarked; items: MediaItem[] }
	> = {
		to_watch: {
			label: t.library.toWatch,
			icon: BookMarked,
			items: toWatchItems,
		},
		watched: { label: t.library.watched, icon: Eye, items: watchedItems },
	};

	const current = tabs[activeTab];
	const activeIndex = activeTab === 'to_watch' ? 0 : 1;

	const controls = useMediaListControls(
		current.items,
		genreNames,
		`reelmark:list:library:${activeTab}`
	);

	const processed = controls.items;

	function switchTab(tab: Tab) {
		setActiveTab(tab);
	}

	return (
		<div>
			<div
				className="relative flex p-1 mb-8 rounded-2xl bg-surface-2 border border-border"
				role="tablist"
				aria-label={t.library.filtersLabel}
			>
				<div
					aria-hidden="true"
					className="absolute top-1 bottom-1 rounded-xl bg-surface border border-border shadow-card-sm transition-[left] duration-(--duration-base) ease-apple-spring"
					style={{
						left: `calc(${activeIndex * 50}% + 0.25rem)`,
						width: 'calc(50% - 0.5rem)',
					}}
				/>
				{(Object.entries(tabs) as [Tab, (typeof tabs)[Tab]][]).map(
					([id, tab]) => (
						<button
							key={id}
							role="tab"
							aria-selected={activeTab === id}
							aria-controls={`panel-${id}`}
							onClick={() => switchTab(id)}
							className={cn(
								'relative z-10 flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl min-h-11 transition-[color,scale] duration-(--duration-fast) cursor-pointer active:scale-95',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
								activeTab === id
									? 'text-text'
									: 'text-muted hover:text-text'
							)}
						>
							<tab.icon className="h-4 w-4" />
							{tab.label}
							<span
								className={cn(
									'ml-1 px-1.5 py-0.5 rounded-full text-xs',
									activeTab === id
										? 'bg-primary/20 text-text'
										: 'bg-surface-3 text-muted'
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
					className="flex flex-col items-center justify-center py-32 animate-fade-in"
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
					<MediaListControls controls={controls} className="mb-6" />

					{processed.length === 0 ? (
						<p className="text-muted text-sm py-20 text-center">
							{t.lists.noResults}
						</p>
					) : (
						<div role="tabpanel" id={`panel-${activeTab}`}>
							<VirtualMediaGrid
								items={processed}
								columns={LIBRARY_COLUMNS}
								rowClassName={LIBRARY_ROW_CLASS}
								renderItem={(item, index) => {
									const entry = item.watchlistEntry;
									const progress =
										item.media_type === 'tv'
											? tvProgress[item.id]
											: undefined;
									return (
										<div
											key={entry?.id ?? getMediaKey(item)}
											className="media-grid-cell"
										>
											<MediaCard
												media={item}
												watchlistEntry={entry}
												hideRating
												priority={index < 6}
												tvProgress={progress}
											/>
										</div>
									);
								}}
							/>
						</div>
					)}
				</>
			)}
		</div>
	);
}
