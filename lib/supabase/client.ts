import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/** Supabase browser client for client components. Passkeys are opt-in while the API is in beta. */
export function createClient() {
	return createBrowserClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{ auth: { experimental: { passkey: true } } }
	);
}
