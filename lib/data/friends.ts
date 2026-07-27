import 'server-only';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server';
import { getPrivacySettings } from '@/lib/data/profile';
import { FRIENDSHIP_COLUMNS } from '@/lib/supabase/columns';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { resolveAvatarUrl } from '@/lib/avatar';
import type {
	Friendship,
	FriendEntry,
	PendingRequestEntry,
} from '@/types/profile';

/**
 * Returns the friendship record between the authenticated user and a target user, or null.
 *
 * @param targetUserId - Supabase user ID of the other party.
 * @returns Friendship or null.
 */
export async function getFriendshipStatus(
	targetUserId: string
): Promise<Friendship | null> {
	const { supabase, userId } = await getAuthenticatedUser();

	const { data } = await supabase
		.from('friendships')
		.select(FRIENDSHIP_COLUMNS)
		.or(
			`and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),` +
				`and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`
		)
		.maybeSingle();

	return (data as Friendship) ?? null;
}

/**
 * Returns pending friend requests addressed to the authenticated user, enriched with profile data.
 *
 * @returns Array of PendingRequestEntry records with username and optional avatar/fullName.
 */
export async function getPendingRequestsWithProfiles(): Promise<
	PendingRequestEntry[]
> {
	const { supabase, userId } = await getAuthenticatedUser();

	const rawPending = await fetchAllRows((from, to) =>
		supabase
			.from('friendships')
			.select(FRIENDSHIP_COLUMNS)
			.eq('addressee_id', userId)
			.eq('status', 'pending')
			.order('id')
			.range(from, to)
	);

	if (rawPending.length === 0) return [];

	const pending = rawPending as Friendship[];
	const requesterIds = pending.map((f) => f.requester_id);

	const { data: profiles } = await supabase
		.from('user_profiles')
		.select('user_id, username, avatar_url, full_name')
		.in('user_id', requesterIds);

	const profileByUserId = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

	const entries: PendingRequestEntry[] = [];
	for (const f of pending) {
		const profile = profileByUserId.get(f.requester_id);
		if (!profile) continue;
		entries.push({
			friendship: f,
			username: profile.username,
			avatarUrl: resolveAvatarUrl(profile.avatar_url, null) ?? undefined,
			fullName: profile.full_name ?? undefined,
		});
	}

	return entries;
}

/**
 * Returns accepted friendships for a given user, enriched with profile data and avatars.
 *
 * @param userId - Supabase user ID of the profile owner.
 * @returns Array of FriendEntry records with username, avatarUrl, and fullName.
 */
export async function getFriendsWithProfiles(
	userId: string
): Promise<FriendEntry[]> {
	const { userId: viewerId } = await getAuthenticatedUser();

	if (viewerId !== userId) {
		const { friends_visibility } = await getPrivacySettings(userId);
		if (friends_visibility === 'private') return [];
		if (friends_visibility === 'friends') {
			const friendship = await getFriendshipStatus(userId);
			if (friendship?.status !== 'accepted') return [];
		}
	}

	const supabase = createAdminClient();

	const rawFriends = await fetchAllRows((from, to) =>
		supabase
			.from('friendships')
			.select(FRIENDSHIP_COLUMNS)
			.or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
			.eq('status', 'accepted')
			.order('id')
			.range(from, to)
	);

	if (rawFriends.length === 0) return [];

	const friends = rawFriends as Friendship[];
	const friendUserIds = friends.map((f) =>
		f.requester_id === userId ? f.addressee_id : f.requester_id
	);

	const { data: profiles } = await supabase
		.from('user_profiles')
		.select('user_id, username, avatar_url, full_name')
		.in('user_id', friendUserIds);

	const profileByUserId = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

	const entries: FriendEntry[] = [];
	for (const f of friends) {
		const otherId =
			f.requester_id === userId ? f.addressee_id : f.requester_id;
		const profile = profileByUserId.get(otherId);
		if (!profile) continue;
		entries.push({
			friendship: f,
			username: profile.username,
			avatarUrl: resolveAvatarUrl(profile.avatar_url, null) ?? undefined,
			fullName: profile.full_name ?? undefined,
		});
	}

	return entries;
}
