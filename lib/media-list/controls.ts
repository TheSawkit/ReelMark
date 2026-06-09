import type { MediaItem } from '@/types/tmdb';
import { getMediaKey } from '@/lib/media';

export type SortKey = 'added' | 'year' | 'title' | 'rating';
export type SortDir = 'asc' | 'desc';

export interface ListControlsState {
	sortKey: SortKey;
	sortDir: SortDir;
	genreIds: number[];
	actorQuery: string;
}

export const SORT_KEYS: readonly SortKey[] = [
	'added',
	'year',
	'title',
	'rating',
];

export const DEFAULT_LIST_CONTROLS: ListControlsState = {
	sortKey: 'added',
	sortDir: 'desc',
	genreIds: [],
	actorQuery: '',
};

function releaseYear(item: MediaItem): number | null {
	const year = Number.parseInt(item.release_date.slice(0, 4), 10);
	return Number.isFinite(year) ? year : null;
}

function sortValue(item: MediaItem, key: SortKey): number | null {
	switch (key) {
		case 'added':
			return item.addedAt ? Date.parse(item.addedAt) || null : null;
		case 'year':
			return releaseYear(item);
		case 'rating':
			return item.userRating ?? null;
		default:
			return null;
	}
}

/**
 * Applies genre/actor filters then sorting to a media list. Pure and side-effect free
 * so it runs identically on server and client. Items missing the active sort value are
 * always ordered last, regardless of direction. `actorMatchKeys` (from a server action)
 * restricts the list to matching media keys when an actor filter is active.
 */
export function applyListControls(
	items: MediaItem[],
	state: ListControlsState,
	actorMatchKeys?: ReadonlySet<string> | null
): MediaItem[] {
	const { sortKey, sortDir, genreIds } = state;

	let result = items;

	if (genreIds.length > 0) {
		result = result.filter((item) =>
			(item.genre_ids ?? []).some((id) => genreIds.includes(id))
		);
	}

	if (actorMatchKeys) {
		result = result.filter((item) => actorMatchKeys.has(getMediaKey(item)));
	}

	const dir = sortDir === 'asc' ? 1 : -1;

	return [...result].sort((a, b) => {
		if (sortKey === 'title') {
			return a.title.localeCompare(b.title) * dir;
		}
		const va = sortValue(a, sortKey);
		const vb = sortValue(b, sortKey);
		if (va === null && vb === null) return 0;
		if (va === null) return 1;
		if (vb === null) return -1;
		return (va - vb) * dir;
	});
}

/**
 * Returns the distinct, named genres present across a media list, sorted alphabetically,
 * for building the genre filter options.
 */
export function availableGenres(
	items: MediaItem[],
	genreNames: Record<number, string>
): Array<{ id: number; name: string }> {
	const ids = new Set<number>();
	for (const item of items) {
		for (const id of item.genre_ids ?? []) ids.add(id);
	}
	return Array.from(ids)
		.map((id) => ({ id, name: genreNames[id] ?? '' }))
		.filter((genre) => genre.name !== '')
		.sort((a, b) => a.name.localeCompare(b.name));
}
