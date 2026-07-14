const DISMISS_PREFIX = 'reelmark:season-catchup';

const dismissKey = (tvId: number, seasonNumber: number) =>
	`${DISMISS_PREFIX}:${tvId}:${seasonNumber}`;

/** Episode numbers below `episodeNumber` still missing from `watched`, ascending. */
export function missingEpisodesBefore(
	episodeNumber: number,
	watched: ReadonlySet<number>
): number[] {
	const missing: number[] = [];
	for (let i = 1; i < episodeNumber; i++) {
		if (!watched.has(i)) missing.push(i);
	}
	return missing;
}

/**
 * True when marking `episodeNumber` skips over at least one episode, i.e. the
 * user jumped more than one step past their furthest watched episode.
 */
export function isSeasonSkip(
	episodeNumber: number,
	watchedBefore: ReadonlySet<number>
): boolean {
	let highest = 0;
	for (const number of watchedBefore) {
		if (number < episodeNumber && number > highest) highest = number;
	}
	return episodeNumber - highest > 1;
}

/** Season the user explicitly refused the catch-up prompt for; never ask again. */
export function isCatchUpDismissed(
	tvId: number,
	seasonNumber: number
): boolean {
	try {
		return localStorage.getItem(dismissKey(tvId, seasonNumber)) !== null;
	} catch {
		return false;
	}
}

export function dismissCatchUp(tvId: number, seasonNumber: number): void {
	try {
		localStorage.setItem(dismissKey(tvId, seasonNumber), '1');
	} catch {
		return;
	}
}
