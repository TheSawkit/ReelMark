const NAME_ALIASES: Record<string, string> = {
	amazon: 'amazonprimevideo',
	amazonprime: 'amazonprimevideo',
	hbomax: 'max',
	hbo: 'max',
	paramountplus: 'paramountplus',
	paramount: 'paramountplus',
	peacockpremium: 'peacockpremium',
	peacock: 'peacockpremium',
	nowtv: 'nowtv',
	now: 'nowtv',
	disney: 'disneyplus',
	disneyplus: 'disneyplus',
};

const PREFIX_MATCH_MIN_LENGTH = 5;

export function normalizeName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function providerAlias(key: string): string | undefined {
	return NAME_ALIASES[key];
}

/**
 * Comparable identity of a provider name, alias-folded so one service keeps a single key
 * across sources — TMDB says "HBO Max" where Watchmode says "Max".
 */
export function providerNameKey(name: string): string {
	const key = normalizeName(name);
	return NAME_ALIASES[key] ?? key;
}

/**
 * Whether two provider names designate the same service. Matching is name-based on purpose:
 * a title's offers may come from Watchmode, whose numeric ids live in a different space than
 * the TMDB ids the user's selection is stored with.
 */
export function isSameProvider(a: string, b: string): boolean {
	const keyA = providerNameKey(a);
	const keyB = providerNameKey(b);

	if (keyA === keyB) return true;
	if (
		keyA.length < PREFIX_MATCH_MIN_LENGTH ||
		keyB.length < PREFIX_MATCH_MIN_LENGTH
	)
		return false;

	return keyA.startsWith(keyB) || keyB.startsWith(keyA);
}
