import type { createClient } from '@/lib/supabase/client';
import { reportSwallowed } from '@/lib/report';

type BrowserClient = ReturnType<typeof createClient>;

/** Runs `setup` once the browser Supabase client is loaded on demand — keeps supabase-js out of every page's bundle for visitors who never sign in; returns the effect cleanup. */
export function withBrowserClient(
	setup: (supabase: BrowserClient) => () => void
): () => void {
	let cancelled = false;
	let cleanup: (() => void) | undefined;

	import('@/lib/supabase/client')
		.then(({ createClient }) => {
			if (!cancelled) cleanup = setup(createClient());
		})
		.catch((error: unknown) =>
			reportSwallowed('supabase:lazy-client', error)
		);

	return () => {
		cancelled = true;
		cleanup?.();
	};
}

/**
 * `withBrowserClient` for Realtime subscriptions: runs `setup` once the socket carries the
 * signed-in user's token, and not at all without a session. Joining earlier sends the
 * publishable key, i.e. the `anon` role, which Realtime rejects on owner-only tables
 * ("invalid column for filter user_id") before rejoining — two error log lines and an extra
 * join on every page load.
 */
export function withRealtimeClient(
	setup: (supabase: BrowserClient) => () => void
): () => void {
	return withBrowserClient((supabase) => {
		let cancelled = false;
		let cleanup: (() => void) | undefined;

		supabase.auth
			.getSession()
			.then(async ({ data }) => {
				if (cancelled || !data.session) return;
				await supabase.realtime.setAuth();
				if (!cancelled) cleanup = setup(supabase);
			})
			.catch((error: unknown) =>
				reportSwallowed('supabase:realtime-auth', error)
			);

		return () => {
			cancelled = true;
			cleanup?.();
		};
	});
}
