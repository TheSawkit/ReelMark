'use client';

import { useEffect, useState, useRef, useCallback, useTransition } from 'react';
import { useInView } from '@/hooks/useInView';
import type { MediaItem } from '@/types/tmdb';
import { MediaGrid } from '@/components/media/card/MediaGrid';
import { MediaCardSkeleton } from '@/components/media/card/MediaCardSkeleton';
import { BackToTopButton } from '@/components/shared/BackToTopButton';
import { fetchMoreMedia } from '@/app/actions/media';
import { useTranslation } from '@/lib/i18n/context';
import { getMediaKey } from '@/lib/media';
import type { InfiniteScrollMediaProps } from '@/types/components';

const MAX_RENDERED_ITEMS = 80;

/** Carries the server's latest watchlist status onto already-rendered items, keeping the same array when nothing moved. */
function withRefreshedWatchStatus(
	current: MediaItem[],
	refreshed: MediaItem[]
): MediaItem[] {
	let changed = false;
	const next = current.map((item) => {
		const match = refreshed.find(
			(candidate) =>
				candidate.id === item.id &&
				candidate.media_type === item.media_type
		);
		if (
			!match ||
			match.watchlistEntry?.status === item.watchlistEntry?.status
		) {
			return item;
		}
		changed = true;
		return { ...item, watchlistEntry: match.watchlistEntry };
	});
	return changed ? next : current;
}

export function InfiniteScrollMedia({
	initialItems,
	category,
	hideRating,
	showWatchlistMeta,
}: InfiniteScrollMediaProps) {
	const [items, setItems] = useState<MediaItem[]>(initialItems);
	const [page, setPage] = useState(2);
	const [isPending, startTransition] = useTransition();
	const [hasMore, setHasMore] = useState(
		() => initialItems.length < MAX_RENDERED_ITEMS
	);
	const [loadError, setLoadError] = useState(false);
	const loaderRef = useRef<HTMLDivElement>(null);
	const isLoaderVisible = useInView(loaderRef, {
		rootMargin: '0px 0px 300px 0px',
	});
	const { t } = useTranslation();

	const [prevCategory, setPrevCategory] = useState(category);
	const [prevInitialItems, setPrevInitialItems] = useState(initialItems);

	if (prevCategory !== category) {
		setPrevCategory(category);
		setPrevInitialItems(initialItems);
		setItems(initialItems);
		setPage(2);
		setHasMore(initialItems.length < MAX_RENDERED_ITEMS);
		setLoadError(false);
	} else if (prevInitialItems !== initialItems) {
		setPrevInitialItems(initialItems);
		setItems((prev) => withRefreshedWatchStatus(prev, initialItems));
	}

	const loadMore = useCallback(() => {
		if (isPending || !hasMore || loadError) return;

		startTransition(async () => {
			try {
				const newItems = await fetchMoreMedia(category, page);

				if (newItems.length === 0) {
					setHasMore(false);
					return;
				}

				setItems((prev) => {
					const existingIds = new Set(prev.map(getMediaKey));
					const uniqueItems = newItems.filter(
						(m) => !existingIds.has(getMediaKey(m))
					);
					if (uniqueItems.length === 0) {
						setHasMore(false);
						return prev;
					}
					const merged = [...prev, ...uniqueItems];
					if (merged.length >= MAX_RENDERED_ITEMS) {
						setHasMore(false);
					}
					return merged;
				});
				setPage((prev) => prev + 1);
			} catch {
				setLoadError(true);
			}
		});
	}, [isPending, hasMore, loadError, page, category]);

	const lastLoadAt = useRef(0);

	useEffect(() => {
		if (!isLoaderVisible || !hasMore || isPending || loadError) return;
		const cooldown = 350;
		const wait = Math.max(
			0,
			cooldown - (performance.now() - lastLoadAt.current)
		);
		const id = setTimeout(() => {
			lastLoadAt.current = performance.now();
			loadMore();
		}, wait);
		return () => clearTimeout(id);
	}, [isLoaderVisible, hasMore, isPending, loadError, loadMore]);

	return (
		<>
			<MediaGrid
				items={items}
				hideRating={hideRating ?? category === 'upcoming'}
				showWatchlistMeta={showWatchlistMeta}
			/>

			<div ref={loaderRef} aria-hidden="true" />

			{isPending && (
				<div
					className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8 mt-4 md:mt-6 lg:mt-8"
					role="status"
					aria-live="polite"
					aria-label={t.common.loading}
				>
					{Array.from({ length: 6 }).map((_, i) => (
						<MediaCardSkeleton key={i} />
					))}
				</div>
			)}

			{!hasMore && !loadError && (
				<div className="text-center py-8 text-muted">
					{t.movie.scrollEnd} · {items.length}{' '}
					{t.movie.scrollEndCount}
				</div>
			)}

			{loadError && (
				<div role="alert" className="text-center py-8 text-muted">
					{t.common.errorDescription}
				</div>
			)}

			<BackToTopButton />
		</>
	);
}
