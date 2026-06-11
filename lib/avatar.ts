/**
 * Resolves the avatar to display, preferring the user's custom upload (stored in
 * user_profiles.avatar_url) over the OAuth provider picture (user_metadata.avatar_url),
 * which Supabase re-syncs from the identity on every sign-in.
 */
export function resolveAvatarUrl(
	customUrl: unknown,
	fallbackUrl: unknown
): string | null {
	if (typeof customUrl === 'string' && customUrl) return customUrl;
	if (typeof fallbackUrl === 'string' && fallbackUrl) return fallbackUrl;
	return null;
}
