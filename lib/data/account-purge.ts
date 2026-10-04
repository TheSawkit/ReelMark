import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type TableName = keyof Database['public']['Tables'];

/**
 * Every table whose rows belong to a user through `user_id`, deleted in this order before the
 * account itself. The account deletion does not rely on foreign-key cascades: they are not all
 * `ON DELETE CASCADE` (`notifications.sender_id` is `SET NULL`), and a missing one either leaves
 * orphan rows or makes `auth.admin.deleteUser` fail.
 */
export const USER_OWNED_TABLES = [
	'mcp_keys',
	'episode_watches',
	'watchlist',
	'reviews',
	'recommendation_dismissals',
	'user_streaming_providers',
	'user_prompts',
	'notification_preferences',
	'push_subscriptions',
	'notifications',
	'playlists',
	'privacy_settings',
	'user_profiles',
] as const satisfies readonly TableName[];

function assertDeleted(table: string, error: { message: string } | null) {
	if (error) throw new Error(`${table}: ${error.message}`);
}

/**
 * Deletes everything a user owns, with the service-role client so no RLS policy can silently
 * skip a row. The AI link goes first: it stops working even if a later step fails.
 *
 * @throws Error naming the table whose deletion failed.
 */
export async function purgeUserData(
	admin: SupabaseClient<Database>,
	userId: string
): Promise<void> {
	const { data: playlists, error: playlistsError } = await admin
		.from('playlists')
		.select('id')
		.eq('user_id', userId);
	assertDeleted('playlists', playlistsError);

	const { error: keyError } = await admin
		.from('mcp_keys')
		.delete()
		.eq('user_id', userId);
	assertDeleted('mcp_keys', keyError);

	const playlistIds = (playlists ?? []).map(({ id }) => id);
	if (playlistIds.length > 0) {
		const { error } = await admin
			.from('playlist_items')
			.delete()
			.in('playlist_id', playlistIds);
		assertDeleted('playlist_items', error);
	}

	const [friendships, sentNotifications] = await Promise.all([
		admin
			.from('friendships')
			.delete()
			.or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
		admin.from('notifications').delete().eq('sender_id', userId),
	]);
	assertDeleted('friendships', friendships.error);
	assertDeleted('notifications', sentNotifications.error);

	for (const table of USER_OWNED_TABLES.slice(1)) {
		const { error } = await admin
			.from(table)
			.delete()
			.eq('user_id', userId);
		assertDeleted(table, error);
	}
}
