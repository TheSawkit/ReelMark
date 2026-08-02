/** Sorties en salle : projection limitée puis nationale. */
export const THEATRICAL_RELEASE_TYPES = '2|3';

// Une exploitation dure rarement plus de six semaines, et les avant-premières se réservent une
// semaine à l'avance : reproduit la fenêtre que TMDB calcule pour `/movie/now_playing`.
const IN_THEATERS_DAYS = 42;
const PREVIEW_DAYS = 7;

function offsetDay(from: Date, days: number): string {
	const shifted = new Date(from);
	shifted.setDate(shifted.getDate() + days);
	return shifted.toISOString().split('T')[0];
}

/**
 * Plancher sur la date de sortie d'origine : année en cours et précédente.
 * TMDB compte les ressorties parmi les sorties en salle tout en renvoyant la date d'origine,
 * si bien que « Au cinéma » remontait The Matrix (1999), Alien (1979) ou 2001 (1968),
 * régulièrement reprogrammés en France.
 */
export function originalReleaseFloor(today: Date): string {
	return `${today.getFullYear() - 1}-01-01`;
}

/** Filtres de date des films actuellement à l'affiche. */
export function inTheatersDates(today: Date): Record<string, string> {
	return {
		'release_date.gte': offsetDay(today, -IN_THEATERS_DAYS),
		'release_date.lte': offsetDay(today, PREVIEW_DAYS),
		'primary_release_date.gte': originalReleaseFloor(today),
	};
}

/** Filtres de date des films encore à sortir. */
export function upcomingDates(today: Date): Record<string, string> {
	return {
		'release_date.gte': offsetDay(today, 0),
		'primary_release_date.gte': originalReleaseFloor(today),
	};
}
