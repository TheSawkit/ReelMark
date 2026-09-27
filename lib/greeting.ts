export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export type GreetingLines = Record<DayPart, readonly string[]>;

/** Maps a local hour (0-23) to the part of the day a greeting speaks to. */
export function dayPartOf(hour: number): DayPart {
	if (hour >= 5 && hour < 12) return 'morning';
	if (hour >= 12 && hour < 18) return 'afternoon';
	if (hour >= 18 && hour < 23) return 'evening';
	return 'night';
}

/** Picks a greeting for the day part with the user's name, never the previous one when another exists — so the dashboard doesn't repeat itself. */
export function pickGreeting(
	lines: GreetingLines,
	part: DayPart,
	name: string,
	random: () => number,
	previous?: string
): string {
	const all = lines[part].map((line) => line.replace('{name}', name));
	const fresh = all.filter((line) => line !== previous);
	const pool = fresh.length > 0 ? fresh : all;
	return pool[Math.floor(random() * pool.length)];
}
