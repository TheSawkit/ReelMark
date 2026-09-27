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
