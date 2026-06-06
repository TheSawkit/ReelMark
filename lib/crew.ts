import type { Crew, GroupedCrew } from '@/types/tmdb';

const WRITER_JOBS = ['Screenplay', 'Writer', 'Story'];

function dedupeById(people: Crew[]): Crew[] {
	const seen = new Map<number, Crew>();
	for (const person of people) {
		if (!seen.has(person.id)) seen.set(person.id, person);
	}
	return Array.from(seen.values());
}

/**
 * Groups a TMDB crew array by display role, deduplicating anyone credited
 * under several jobs within the same role.
 */
export function groupCrew(crew: Crew[]): GroupedCrew {
	return {
		directors: dedupeById(crew.filter((p) => p.job === 'Director')),
		writers: dedupeById(crew.filter((p) => WRITER_JOBS.includes(p.job))),
		producers: dedupeById(crew.filter((p) => p.job === 'Producer')),
		dop: dedupeById(
			crew.filter((p) => p.job === 'Director of Photography')
		),
		composers: dedupeById(
			crew.filter((p) => p.job === 'Original Music Composer')
		),
		editors: dedupeById(crew.filter((p) => p.job === 'Editor')),
	};
}
