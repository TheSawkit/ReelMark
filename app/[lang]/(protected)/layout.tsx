/**
 * Pass-through layout for the (protected) group.
 *
 * The auth and onboarding gates live in `proxy.ts` (`lib/proxy/auth-routing.ts`): resolving
 * them here would block the whole segment from prerendering a static shell. Pages still call
 * `requireAuth()` / `getAuthenticatedUser()` inside their Suspense boundaries, so the data
 * layer stays guarded even if a route escapes the proxy matcher.
 */
export default function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
