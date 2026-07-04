'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import type { MediaItem } from '@/types/tmdb';

export interface UserSearchResult {
	user_id: string;
	username: string;
	bio: string | null;
	avatar_url: string | null;
}

/**
 * Fetches live search suggestions from `/api/search`, debounced 300ms.
 * Queries starting with '@' search user profiles instead of media.
 */
export function useSearchSuggestions(query: string) {
	const { lang } = useTranslation();
	const [results, setResults] = useState<MediaItem[]>([]);
	const [users, setUsers] = useState<UserSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [trackedQuery, setTrackedQuery] = useState(query);

	if (trackedQuery !== query) {
		setTrackedQuery(query);
		if (query.trim().length < 2) {
			setResults([]);
			setUsers([]);
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
					`/api/search?query=${encodeURIComponent(query)}&lang=${lang}`,
					{ signal: controller.signal }
				);
				if (!response.ok)
					throw new Error(`Search failed: ${response.status}`);
				const data: {
					results?: MediaItem[];
					users?: UserSearchResult[];
				} = await response.json();

				if ('users' in data) {
					setUsers(Array.isArray(data.users) ? data.users : []);
					setResults([]);
				} else {
					setResults(Array.isArray(data.results) ? data.results : []);
					setUsers([]);
				}
				setIsOpen(true);
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError')
					return;
				setResults([]);
				setUsers([]);
			} finally {
				if (!controller.signal.aborted) setIsLoading(false);
			}
		}, 300);

		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [query, lang]);

	return { results, users, isLoading, isOpen, setIsOpen };
}
