import type {
	JwtPayload,
	UserAppMetadata,
	UserMetadata,
} from '@supabase/supabase-js';

/**
 * The signed-in user as the verified access token describes it. Carries everything the app
 * reads on a request — id, email, metadata — without the Auth round-trip `getUser()` costs.
 * Identities and account dates are not in the token: read them with `getFullUser()`.
 * Dependency-free so the proxy can import it without pulling server-only modules.
 */
export interface SessionUser {
	id: string;
	email?: string;
	user_metadata: UserMetadata;
	app_metadata: UserAppMetadata;
}

/** Maps verified JWT claims to a SessionUser, or null when the token names no user. */
export function sessionUserFromClaims(
	claims: JwtPayload | null | undefined
): SessionUser | null {
	if (!claims?.sub) return null;
	return {
		id: claims.sub,
		email: claims.email,
		user_metadata: claims.user_metadata ?? {},
		app_metadata: claims.app_metadata ?? {},
	};
}
