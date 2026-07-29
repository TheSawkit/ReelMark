'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import type { PersonSuggestion } from '@/types/tmdb';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * Fetches live person suggestions from `/api/search?type=person`, debounced 300ms.
 * Pass an empty query to keep the hook idle (e.g. right after a suggestion was picked).
 */
export function usePersonSuggestions(query: string) {
	const { lang } = useTranslation();
	const [people, setPeople] = useState<PersonSuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [trackedQuery, setTrackedQuery] = useState(query);

	if (trackedQuery !== query) {
		setTrackedQuery(query);
		if (query.trim().length < MIN_QUERY_LENGTH) {
			setPeople([]);
			setIsLoading(false);
		}
	}

	useEffect(() => {
		if (query.trim().length < MIN_QUERY_LENGTH) return;

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(true);

		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/search?type=person&query=${encodeURIComponent(query)}&lang=${lang}`,
					{ signal: controller.signal }
				);
				if (!response.ok)
					throw new Error(`Search failed: ${response.status}`);
				const data: { people?: PersonSuggestion[] } =
					await response.json();
				setPeople(Array.isArray(data.people) ? data.people : []);
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError')
					return;
				setPeople([]);
			} finally {
				if (!controller.signal.aborted) setIsLoading(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [query, lang]);

	return { people, isLoading };
}
