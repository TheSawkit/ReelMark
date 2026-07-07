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

function computeHasMore(
	clientSideData: MediaItem[] | undefined,
	initialItems: MediaItem[]
): boolean {
	if (clientSideData) return clientSideData.length > initialItems.length;
	return initialItems.length < MAX_RENDERED_ITEMS;
}

export function InfiniteScrollMedia({
	initialItems,
	category,
	clientSideData,
	hideRating,
	showWatchlistMeta,
}: InfiniteScrollMediaProps) {
	const [items, setItems] = useState<MediaItem[]>(initialItems);
	const [page, setPage] = useState(2);
	const [isPending, startTransition] = useTransition();
	const [hasMore, setHasMore] = useState(() =>
		computeHasMore(clientSideData, initialItems)
	);
	const [loadError, setLoadError] = useState(false);
	const loaderRef = useRef<HTMLDivElement>(null);
	const isLoaderVisible = useInView(loaderRef, {
		rootMargin: '0px 0px 300px 0px',
	});
	const { t } = useTranslation();

	const prevCategoryRef = useRef(category);

	useEffect(() => {
		if (prevCategoryRef.current !== category) {
			setItems(initialItems);
			setPage(2);
			setHasMore(computeHasMore(clientSideData, initialItems));
			setLoadError(false);
			prevCategoryRef.current = category;
		} else {
			setItems((prev) => {
				let changed = false;
				const next = prev.map((item) => {
					const refreshed = initialItems.find(
						(i) =>
							i.id === item.id && i.media_type === item.media_type
					);
					if (
						refreshed &&
						refreshed.watchlistEntry?.status !==
							item.watchlistEntry?.status
					) {
						changed = true;
						return {
							...item,
							watchlistEntry: refreshed.watchlistEntry,
						};
					}
					return item;
				});
				return changed ? next : prev;
			});
		}
	}, [category, initialItems, clientSideData]);

	const loadMore = useCallback(() => {
		if (isPending || !hasMore || loadError) return;

		startTransition(async () => {
			try {
				let newItems: MediaItem[];

				if (clientSideData) {
					const pageSize = 20;
					const start = (page - 1) * pageSize;
					newItems = clientSideData.slice(start, start + pageSize);
				} else {
					newItems = await fetchMoreMedia(category, page);
				}

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
					if (
						clientSideData &&
						merged.length >= clientSideData.length
					) {
						setHasMore(false);
					}
					if (
						!clientSideData &&
						merged.length >= MAX_RENDERED_ITEMS
					) {
						setHasMore(false);
					}
					return merged;
				});
				setPage((prev) => prev + 1);
			} catch {
				setLoadError(true);
			}
		});
	}, [isPending, hasMore, loadError, page, clientSideData, category]);

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
