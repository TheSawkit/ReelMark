import { reportSwallowed } from '@/lib/report';

const RELOAD_GUARD_KEY = 'reelmark:stale-build-reload-at';
const RELOAD_GUARD_WINDOW_MS = 600_000;

/** Errors thrown by a tab still running a previous build's JS; also fed to Sentry's `ignoreErrors`. */
export const STALE_BUILD_PATTERN =
	/ChunkLoadError|Loading (chunk|CSS chunk) \S+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

/** Whether an error comes from a chunk of a build the servers no longer carry (tab left open across a deployment). */
export function isStaleBuildError(error: unknown): boolean {
	if (!error) return false;
	const name = error instanceof Error ? error.name : '';
	const message = error instanceof Error ? error.message : String(error);
	return name === 'ChunkLoadError' || STALE_BUILD_PATTERN.test(message);
}

/** Hard-reloads onto the current build, at most once per window so a genuinely broken build fails visibly instead of looping. */
export function recoverFromStaleBuild(): void {
	if (typeof window === 'undefined') return;

	try {
		const lastAttempt = Number(
			window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0
		);
		if (Date.now() - lastAttempt < RELOAD_GUARD_WINDOW_MS) return;
		window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
	} catch (error) {
		reportSwallowed('stale-build:reload-guard', error);
	}

	window.location.reload();
}
