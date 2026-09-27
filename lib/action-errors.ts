/**
 * Error codes thrown by Server Actions and matched by their client callers.
 * Kept dependency-free so a client component can import a code without pulling
 * the server module that throws it into the browser bundle.
 */
export const RATE_LIMITED = 'RATE_LIMITED';

/**
 * Whether a rejected Server Action call is Next's redirect signal rather than a failure — an
 * account-only action called signed out redirects to login, and the client router navigates
 * while the caller's promise rejects with this. Callers skip their error toast for it.
 */
export function isRedirectSignal(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'digest' in error &&
		typeof error.digest === 'string' &&
		error.digest.startsWith('NEXT_REDIRECT')
	);
}
