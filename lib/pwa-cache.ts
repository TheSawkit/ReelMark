const USER_SCOPED_CACHES = [
	'pages',
	'pages-rsc',
	'pages-rsc-prefetch',
	'others',
	'apis',
];

/**
 * Drops the service worker caches that can hold responses rendered for the signed-in user.
 * Must run before ending a session: the page caches are served on a slow or dead network,
 * so a stale authenticated document would otherwise survive signout on a shared device.
 * Static assets are left warm on purpose.
 */
export async function clearUserScopedCaches(): Promise<void> {
	if (typeof window === 'undefined' || !('caches' in window)) return;

	try {
		await Promise.all(
			USER_SCOPED_CACHES.map((name) => window.caches.delete(name))
		);
	} catch {
		// A failed purge must never block the signout itself.
	}
}
