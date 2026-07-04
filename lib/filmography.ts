import type { MediaItem } from '@/types/tmdb';

export type FilmographyDepartmentKey =
	'directing' | 'writing' | 'production' | 'camera' | 'sound' | 'editing';

export type FilmographyTabKey = 'acting' | FilmographyDepartmentKey;

export interface FilmographyDepartment {
	key: FilmographyTabKey;
	items: MediaItem[];
}

export interface CrewCreditItem {
	department: string;
	item: MediaItem;
}

const DEPARTMENT_MAP: Record<string, FilmographyDepartmentKey> = {
	Directing: 'directing',
	Writing: 'writing',
	Production: 'production',
	Camera: 'camera',
	Sound: 'sound',
	Editing: 'editing',
};

const DEPARTMENT_ORDER: FilmographyDepartmentKey[] = [
	'directing',
	'writing',
	'production',
	'camera',
	'sound',
	'editing',
];

function dedupeAndSort(items: MediaItem[]): MediaItem[] {
	const seen = new Set<string>();
	return items
		.filter((item) => item.poster_path)
		.filter((item) => {
			const key = `${item.media_type}-${item.id}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.sort((a, b) => b.popularity - a.popularity);
}

function knownForTabKey(department: string): FilmographyTabKey | null {
	if (department === 'Acting') return 'acting';
	return DEPARTMENT_MAP[department] ?? null;
}

/**
 * Assembles a person's filmography into ordered, deduplicated department tabs,
 * surfacing their known-for craft first so a director lands on their films, not their cameos.
 * Crew departments without a mapped tab (Art, VFX, Lighting…) are intentionally dropped.
 */
export function buildFilmographyDepartments(
	actingItems: MediaItem[],
	crewItems: CrewCreditItem[],
	knownForDepartment: string
): FilmographyDepartment[] {
	const buckets = new Map<FilmographyDepartmentKey, MediaItem[]>();
	for (const { department, item } of crewItems) {
		const key = DEPARTMENT_MAP[department];
		if (!key) continue;
		const bucket = buckets.get(key) ?? [];
		bucket.push(item);
		buckets.set(key, bucket);
	}

	const departments: FilmographyDepartment[] = [];
	const acting = dedupeAndSort(actingItems);
	if (acting.length > 0) departments.push({ key: 'acting', items: acting });
	for (const key of DEPARTMENT_ORDER) {
		const items = buckets.get(key);
		if (items && items.length > 0) {
			departments.push({ key, items: dedupeAndSort(items) });
		}
	}

	const primary = knownForTabKey(knownForDepartment);
	if (primary) {
		const index = departments.findIndex(
			(department) => department.key === primary
		);
		if (index > 0) departments.unshift(departments.splice(index, 1)[0]);
	}
	return departments;
}
