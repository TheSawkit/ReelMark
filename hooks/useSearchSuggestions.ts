'use client';

import { useState, useEffect } from 'react';
import type { MediaItem } from '@/types/tmdb';

/**
 * Fetches live search suggestions from the internal `/api/search` route,
 * debounced by 300ms with stale-request cancellation via AbortController.
 * Resets results when the query is shorter than 2 characters.
 *
 * @param query - Current search input value.
 * @returns `{ results, isLoading, isOpen, setIsOpen }`
 */
export function useSearchSuggestions(query: string) {
	const [results, setResults] = useState<MediaItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [trackedQuery, setTrackedQuery] = useState(query);

	if (trackedQuery !== query) {
		setTrackedQuery(query);
		if (query.trim().length < 2) {
			setResults([]);
			setIsLoading(false);
		}
	}

	useEffect(() => {
		if (query.trim().length < 2) return;

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(true);

		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/search?query=${encodeURIComponent(query)}`,
					{ signal: controller.signal }
				);
				if (!response.ok)
					throw new Error(`Search failed: ${response.status}`);
				const data: { results?: MediaItem[] } = await response.json();
				setResults(Array.isArray(data.results) ? data.results : []);
				setIsOpen(true);
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError')
					return;
				setResults([]);
			} finally {
				if (!controller.signal.aborted) setIsLoading(false);
			}
		}, 300);

		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [query]);

	return { results, isLoading, isOpen, setIsOpen };
}
