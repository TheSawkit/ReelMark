import type { UserTaste } from '@/lib/data/taste';

const TTL_MS = 120_000;
const MAX_USERS = 10;

const store = new Map<
	string,
	{ expiresAt: number; taste: Promise<UserTaste> }
>();

/**
 * Loads a user's taste at most once every two minutes: an assistant fires several tools in a
 * burst, and a full load of a large library costs ~750 KB of Supabase egress. Concurrent calls
 * share the pending load; a failed load is never cached.
 */
export function cachedUserTaste(
	userId: string,
	load: () => Promise<UserTaste>
): Promise<UserTaste> {
	const now = Date.now();
	const hit = store.get(userId);
	if (hit && hit.expiresAt > now) return hit.taste;

	store.delete(userId);
	if (store.size >= MAX_USERS) {
		const oldest = store.keys().next().value;
		if (oldest !== undefined) store.delete(oldest);
	}
	const taste = load();
	store.set(userId, { expiresAt: now + TTL_MS, taste });
	taste.catch(() => store.delete(userId));
	return taste;
}
