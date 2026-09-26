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

/**
 * Backdrop of a person's most popular film, used as their hero art on wide screens (a portrait
 * photo stretched to a landscape stage would only show a forehead). Null when none has one.
 */
export function pickKnownForBackdrop(
	credits: { backdrop_path: string | null; popularity: number }[]
): string | null {
	let best: { backdrop_path: string | null; popularity: number } | null =
		null;
	for (const credit of credits) {
		if (!credit.backdrop_path) continue;
		if (!best || credit.popularity > best.popularity) best = credit;
	}
	return best?.backdrop_path ?? null;
}
