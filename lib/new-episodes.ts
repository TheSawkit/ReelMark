const DAY_MS = 86_400_000;
const CATCH_UP_DAYS = 2;

/** Whether an episode aired within the announce window, wide enough that a missed daily run still catches up. */
export function isFreshEpisode(airDate: string | null, today: string): boolean {
	if (!airDate) return false;
	const age = Date.parse(today) - Date.parse(airDate);
	return age >= 0 && age <= CATCH_UP_DAYS * DAY_MS;
}

/** Followers still to notify about an episode: not opted out, not already told. */
export function recipientsFor(
	followers: string[],
	optedOut: Set<string>,
	alreadyNotified: Set<string>
): string[] {
	return followers.filter(
		(userId) => !optedOut.has(userId) && !alreadyNotified.has(userId)
	);
}
