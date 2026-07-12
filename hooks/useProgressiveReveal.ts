'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from '@/hooks/useInView';

const DEFAULT_PAGE_SIZE = 24;

/**
 * Reveals a long client-side list in blocks as a sentinel scrolls into view,
 * keeping initial renders small on memory-constrained devices.
 */
export function useProgressiveReveal(
	totalCount: number,
	pageSize = DEFAULT_PAGE_SIZE
) {
	const [visibleCount, setVisibleCount] = useState(pageSize);
	const loaderRef = useRef<HTMLDivElement>(null);
	const isLoaderVisible = useInView(loaderRef, {
		rootMargin: '0px 0px 400px 0px',
	});
	const hasMore = visibleCount < totalCount;

	useEffect(() => {
		if (!isLoaderVisible || !hasMore) return;
		const id = setTimeout(
			() => setVisibleCount((count) => count + pageSize),
			150
		);
		return () => clearTimeout(id);
	}, [isLoaderVisible, hasMore, pageSize]);

	const reset = useCallback(() => setVisibleCount(pageSize), [pageSize]);

	return { visibleCount, hasMore, loaderRef, reset };
}
