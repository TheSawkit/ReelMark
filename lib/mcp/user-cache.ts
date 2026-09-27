import type { UserTaste } from '@/lib/data/taste';
import type { McpUserContext } from '@/types/mcp';

interface UserCache<T> {
	get: (userId: string, load: () => Promise<T>) => Promise<T>;
	/** Drops a user's entry, so the next call loads fresh data after a write. */
	forget: (userId: string) => void;
}

/**
 * Per-user memo with a TTL, for the loads an assistant repeats across a burst of tool calls.
 * Concurrent calls share the pending load; a failed load is never cached; expired entries are
 * swept before each insert, and past `maxUsers` the oldest entry goes first.
 */
function createUserCache<T>(ttlMs: number, maxUsers: number): UserCache<T> {
	const store = new Map<string, { expiresAt: number; value: Promise<T> }>();

	function sweep(now: number) {
		for (const [userId, { expiresAt }] of store) {
			if (expiresAt <= now) store.delete(userId);
		}
		if (store.size >= maxUsers) {
			const oldest = store.keys().next().value;
			if (oldest !== undefined) store.delete(oldest);
		}
	}

	return {
		get(userId, load) {
			const now = Date.now();
			const hit = store.get(userId);
			if (hit && hit.expiresAt > now) return hit.value;

			sweep(now);
			const value = load();
			store.set(userId, { expiresAt: now + ttlMs, value });
			value.catch(() => store.delete(userId));
			return value;
		},
		forget: (userId) => void store.delete(userId),
	};
}

/** Two minutes: a full load of a large library costs ~750 KB of Supabase egress. Few users, since each entry is heavy. */
export const cachedUserTaste = createUserCache<UserTaste>(120_000, 10);

/** Ten minutes: language and region rarely change, and each miss is an Auth admin round trip. */
export const cachedUserContext = createUserCache<McpUserContext>(600_000, 100);
