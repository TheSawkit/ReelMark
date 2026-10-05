/**
 * Refusal codes returned by Server Actions and matched by their client callers.
 * Kept dependency-free so a client component can import a code without pulling
 * the server module that returns it into the browser bundle.
 */
export const RATE_LIMITED = 'RATE_LIMITED';

/** An expected refusal returned by a Server Action — production replaces a thrown message with a generic one, so a code the client branches on must travel as a return value. */
export interface Refusal<Code extends string> {
	refused: Code;
}

/** Whether a Server Action result is a refusal rather than its success value. */
export function isRefusal<Result>(
	result: Result
): result is Extract<Result, Refusal<string>> {
	return typeof result === 'object' && result !== null && 'refused' in result;
}

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
