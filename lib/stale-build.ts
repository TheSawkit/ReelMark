const RELOAD_GUARD_KEY = 'reelmark:stale-build-reload-at';

/**
 * A reload that did not fix the error means the build is broken for a real reason, and the
 * window is what stops that from becoming a reload loop. Ten minutes rather than seconds:
 * one hard reload always lands on the current build, so an immediate repeat is never
 * staleness. The cost is a tab that spans two deployments inside the same ten minutes — it
 * falls back to the error boundary and the visitor refreshes by hand.
 */
const RELOAD_GUARD_WINDOW_MS = 600_000;

/** Also fed to Sentry's `ignoreErrors`, so these never land in Bugsink as if they were bugs. */
export const STALE_BUILD_PATTERN =
	/ChunkLoadError|Loading (chunk|CSS chunk) \S+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

/**
 * Whether an error looks like a tab left open across a deployment: the previously loaded JS
 * still points at the old build's hashed chunk paths, which stop existing the moment the old
 * pods terminate (each pod only ships its own build's `.next/static`). Every further code-split
 * import then fails, on a tab that otherwise looks fine.
 */
export function isStaleBuildError(error: unknown): boolean {
	if (!error) return false;
	const name = error instanceof Error ? error.name : '';
	const message = error instanceof Error ? error.message : String(error);
	return name === 'ChunkLoadError' || STALE_BUILD_PATTERN.test(message);
}

/**
 * Hard-reloads once to pick up the current deployment. Guarded against loops with a short
 * sessionStorage window: a build that is broken for a real reason (not staleness) must fail
 * visibly instead of reloading forever.
 */
export function recoverFromStaleBuild(): void {
	if (typeof window === 'undefined') return;

	try {
		const lastAttempt = Number(
			window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0
		);
		if (Date.now() - lastAttempt < RELOAD_GUARD_WINDOW_MS) return;
		window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
	} catch {
		// Storage unavailable (private mode): reload once, unguarded — still better than a stuck 404.
	}

	window.location.reload();
}
