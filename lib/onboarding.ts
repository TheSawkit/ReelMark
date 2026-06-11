import type { SupabaseServerClient } from '@/lib/supabase/server';

/** Converts an arbitrary display name into a valid username slug ([a-z0-9_], max 50). */
export function slugifyUsername(raw: string): string {
	return raw
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 50)
		.replace(/_+$/g, '');
}

/** Builds a username suggestion from OAuth metadata (given/family name, full name) or email. */
export function suggestUsernameFromMetadata(
	metadata: Record<string, unknown> | null | undefined,
	email: string | null | undefined
): string {
	const m = metadata ?? {};
	const str = (v: unknown): string => (typeof v === 'string' ? v : '');
	const given = str(m.given_name);
	const family = str(m.family_name);
	const full = str(m.full_name) || str(m.name);
	const local = typeof email === 'string' ? email.split('@')[0] : '';

	const candidates = [
		given && family ? `${given}_${family}` : '',
		full,
		given,
		local,
	];
	for (const candidate of candidates) {
		const slug = slugifyUsername(candidate);
		if (slug) return slug;
	}
	return 'user';
}

/** Returns `base`, or the first `base_N` (N≥2) not present in `taken` (compared case-insensitively). */
export function pickUniqueUsername(base: string, taken: Set<string>): string {
	const lowered = new Set([...taken].map((u) => u.toLowerCase()));
	if (!lowered.has(base.toLowerCase())) return base;
	let suffix = 2;
	while (lowered.has(`${base}_${suffix}`.toLowerCase())) suffix++;
	return `${base}_${suffix}`;
}

/**
 * Whether the user must complete onboarding: once `onboardingCompleted` is true it never
 * re-triggers; otherwise it triggers while region or username is missing from metadata.
 */
export function needsOnboarding(
	metadata: Record<string, unknown> | null | undefined,
	onboardingCompleted: boolean | null | undefined
): boolean {
	if (onboardingCompleted) return false;
	const m = metadata ?? {};
	const hasRegion = typeof m.region === 'string' && m.region.length > 0;
	const hasUsername = typeof m.username === 'string' && m.username.length > 0;
	return !hasRegion || !hasUsername;
}

/** Resolves a collision-free username for `base` by scanning existing profiles. */
export async function ensureUniqueUsername(
	supabase: SupabaseServerClient,
	base: string
): Promise<string> {
	const { data } = await supabase
		.from('user_profiles')
		.select('username')
		.ilike('username', `${base}%`);
	const taken = new Set((data ?? []).map((row) => row.username));
	return pickUniqueUsername(base, taken);
}
