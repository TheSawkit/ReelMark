/**
 * Fuseau figé pour tout affichage de date.
 *
 * Les serveurs tournent en UTC et les navigateurs dans le fuseau du visiteur : sans cela,
 * le même timestamp rend deux chaînes différentes de part et d'autre, ce qui casse
 * l'hydratation des composants client qui affichent une date. Une date seule ("2023-07-15")
 * est de plus lue comme minuit UTC, donc décalée d'un jour à l'ouest de Greenwich.
 * Ces libellés sont des jours, pas des heures : les figer en UTC les rend identiques
 * partout, ce qui vaut mieux qu'un décalage d'un jour selon le visiteur.
 */
const DISPLAY_TIME_ZONE = 'UTC';

/** Localized long-form date from an ISO string; null if no input. */
export function formatDate(
	dateString: string | null,
	locale: string,
	options?: Intl.DateTimeFormatOptions
): string | null {
	if (!dateString) return null;

	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	};

	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return null;

	return date.toLocaleDateString(locale, {
		...(options ?? defaultOptions),
		timeZone: DISPLAY_TIME_ZONE,
	});
}

/** Short localized date (e.g. "15 Jul 2023") from an ISO string; empty when unparseable. */
export function formatShortDate(dateString: string, locale: string): string {
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return '';

	return date.toLocaleDateString(locale, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: DISPLAY_TIME_ZONE,
	});
}

/** Converts minutes to a human-readable runtime string ("2h 15min"). */
export function formatRuntime(minutes: number): string {
	if (minutes <= 0) return '';
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
}

/** Age in full years from birthday to deathday (or today); null if no birthday. */
export function calculateAge(
	birthday: string | null,
	deathday: string | null
): number | null {
	if (!birthday) return null;
	const birth = new Date(birthday);
	const end = deathday ? new Date(deathday) : new Date();
	return Math.floor(
		(end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
	);
}
