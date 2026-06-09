'use client';

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useSyncExternalStore,
} from 'react';
import type { MediaItem } from '@/types/tmdb';
import {
	applyListControls,
	availableGenres,
	DEFAULT_LIST_CONTROLS,
	type ListControlsState,
	type SortKey,
} from '@/lib/media-list/controls';
import { filterListByActor } from '@/app/actions/media';

const ACTOR_DEBOUNCE_MS = 400;
const ACTOR_MIN_LENGTH = 2;
const STORE_EVENT = 'reelmark:list-controls-change';

const snapshotCache = new Map<
	string,
	{ raw: string | null; value: ListControlsState }
>();

function parseState(raw: string | null): ListControlsState {
	if (!raw) return DEFAULT_LIST_CONTROLS;
	try {
		const parsed = JSON.parse(raw) as Partial<ListControlsState>;
		return {
			...DEFAULT_LIST_CONTROLS,
			...parsed,
			genreIds: Array.isArray(parsed.genreIds) ? parsed.genreIds : [],
		};
	} catch {
		return DEFAULT_LIST_CONTROLS;
	}
}

function readSnapshot(storageKey: string): ListControlsState {
	let raw: string | null = null;
	try {
		raw = window.localStorage.getItem(storageKey);
	} catch {
		raw = null;
	}
	const cached = snapshotCache.get(storageKey);
	if (cached && cached.raw === raw) return cached.value;
	const value = parseState(raw);
	snapshotCache.set(storageKey, { raw, value });
	return value;
}

function persistState(storageKey: string, value: ListControlsState): void {
	const raw = JSON.stringify(value);
	try {
		window.localStorage.setItem(storageKey, raw);
	} catch {
		/* storage unavailable (private mode / quota) — ignore */
	}
	snapshotCache.set(storageKey, { raw, value });
	window.dispatchEvent(new Event(STORE_EVENT));
}

export interface UseMediaListControls {
	state: ListControlsState;
	items: MediaItem[];
	genres: Array<{ id: number; name: string }>;
	isActorLoading: boolean;
	setSort: (key: SortKey) => void;
	toggleDir: () => void;
	toggleGenre: (id: number) => void;
	clearGenres: () => void;
	setActorQuery: (query: string) => void;
	clearActor: () => void;
	clearAll: () => void;
	hasActiveFilters: boolean;
}

/**
 * Drives a media list's sort/filter controls: genre + sort run synchronously in memory,
 * the actor filter resolves on demand via a debounced server action, and the whole state
 * persists to `localStorage` under `storageKey` (SSR-safe via useSyncExternalStore).
 * Returns the processed items plus setters.
 */
export function useMediaListControls(
	allItems: MediaItem[],
	genreNames: Record<number, string>,
	storageKey: string
): UseMediaListControls {
	const subscribe = useCallback((onChange: () => void) => {
		window.addEventListener(STORE_EVENT, onChange);
		window.addEventListener('storage', onChange);
		return () => {
			window.removeEventListener(STORE_EVENT, onChange);
			window.removeEventListener('storage', onChange);
		};
	}, []);

	const state = useSyncExternalStore(
		subscribe,
		() => readSnapshot(storageKey),
		() => DEFAULT_LIST_CONTROLS
	);

	const setState = useCallback(
		(updater: (prev: ListControlsState) => ListControlsState) => {
			persistState(storageKey, updater(readSnapshot(storageKey)));
		},
		[storageKey]
	);

	const [actorKeys, setActorKeys] = useState<Set<string> | null>(null);
	const [actorLoading, setActorLoading] = useState(false);

	const actorActive = state.actorQuery.trim().length >= ACTOR_MIN_LENGTH;

	const actorInput = useMemo(
		() =>
			allItems.map((item) => ({
				id: item.id,
				media_type: item.media_type,
			})),
		[allItems]
	);

	useEffect(() => {
		const query = state.actorQuery.trim();
		if (query.length < ACTOR_MIN_LENGTH) return;

		let cancelled = false;
		const timer = setTimeout(() => {
			setActorLoading(true);
			filterListByActor(actorInput, query)
				.then((keys) => {
					if (!cancelled) setActorKeys(new Set(keys));
				})
				.catch(() => {
					if (!cancelled) setActorKeys(new Set());
				})
				.finally(() => {
					if (!cancelled) setActorLoading(false);
				});
		}, ACTOR_DEBOUNCE_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [state.actorQuery, actorInput]);

	const effectiveActorKeys = actorActive ? actorKeys : null;

	const items = useMemo(
		() => applyListControls(allItems, state, effectiveActorKeys),
		[allItems, state, effectiveActorKeys]
	);

	const genres = useMemo(
		() => availableGenres(allItems, genreNames),
		[allItems, genreNames]
	);

	const setSort = useCallback(
		(key: SortKey) => setState((prev) => ({ ...prev, sortKey: key })),
		[setState]
	);

	const toggleDir = useCallback(
		() =>
			setState((prev) => ({
				...prev,
				sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc',
			})),
		[setState]
	);

	const toggleGenre = useCallback(
		(id: number) =>
			setState((prev) => ({
				...prev,
				genreIds: prev.genreIds.includes(id)
					? prev.genreIds.filter((genreId) => genreId !== id)
					: [...prev.genreIds, id],
			})),
		[setState]
	);

	const clearGenres = useCallback(
		() => setState((prev) => ({ ...prev, genreIds: [] })),
		[setState]
	);

	const setActorQuery = useCallback(
		(query: string) => setState((prev) => ({ ...prev, actorQuery: query })),
		[setState]
	);

	const clearActor = useCallback(
		() => setState((prev) => ({ ...prev, actorQuery: '' })),
		[setState]
	);

	const clearAll = useCallback(
		() => setState((prev) => ({ ...prev, genreIds: [], actorQuery: '' })),
		[setState]
	);

	const hasActiveFilters =
		state.genreIds.length > 0 || state.actorQuery.trim() !== '';

	return {
		state,
		items,
		genres,
		isActorLoading: actorActive && actorLoading,
		setSort,
		toggleDir,
		toggleGenre,
		clearGenres,
		setActorQuery,
		clearActor,
		clearAll,
		hasActiveFilters,
	};
}
