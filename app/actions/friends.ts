'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server';
import { FRIENDSHIP_COLUMNS } from '@/lib/supabase/columns';
import { revalidateProfile } from '@/app/actions/_helpers';
import type {
    Friendship,
    FriendEntry,
    PendingRequestEntry,
} from '@/types/profile';

/**
 * Returns accepted friendships for a given user (both directions), up to 100.
 *
 * @param userId - Supabase user ID.
 * @returns Array of accepted Friendship records.
 */
export async function getFriends(userId: string): Promise<Friendship[]> {
    const { supabase } = await getAuthenticatedUser();

    const { data, error } = await supabase
        .from('friendships')
        .select(FRIENDSHIP_COLUMNS)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')
        .limit(100);

    if (error) throw new Error(error.message);
    return (data as Friendship[]) ?? [];
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
    const adminClient = createAdminClient();

    const { data: rawPending, error } = await supabase
        .from('friendships')
        .select(FRIENDSHIP_COLUMNS)
        .eq('addressee_id', userId)
        .eq('status', 'pending')
        .limit(100);

    if (error) throw new Error(error.message);
    if (!rawPending || rawPending.length === 0) return [];

    const pending = rawPending as Friendship[];
    const requesterIds = pending.map((f) => f.requester_id);

    const [{ data: profiles }, adminResults] = await Promise.all([
        supabase
            .from('user_profiles')
            .select('user_id, username')
            .in('user_id', requesterIds),
        Promise.all(
            requesterIds.map((id) => adminClient.auth.admin.getUserById(id))
        ),
    ]);

    const profileByUserId = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    const adminByUserId = new Map(
        adminResults.flatMap((r) =>
            r.data.user ? [[r.data.user.id, r.data.user]] : []
        )
    );

    const entries: PendingRequestEntry[] = [];
    for (const f of pending) {
        const profile = profileByUserId.get(f.requester_id);
        if (!profile) continue;
        const adminUser = adminByUserId.get(f.requester_id);
        entries.push({
            friendship: f,
            username: profile.username,
            avatarUrl:
                typeof adminUser?.user_metadata?.avatar_url === 'string'
                    ? adminUser.user_metadata.avatar_url
                    : undefined,
            fullName:
                typeof adminUser?.user_metadata?.full_name === 'string'
                    ? adminUser.user_metadata.full_name
                    : undefined,
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
    const { supabase } = await getAuthenticatedUser();
    const adminClient = createAdminClient();

    const { data: rawFriends, error } = await supabase
        .from('friendships')
        .select(FRIENDSHIP_COLUMNS)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')
        .limit(100);

    if (error) throw new Error(error.message);
    if (!rawFriends || rawFriends.length === 0) return [];

    const friends = rawFriends as Friendship[];
    const friendUserIds = friends.map((f) =>
        f.requester_id === userId ? f.addressee_id : f.requester_id
    );

    const [{ data: profiles }, adminResults] = await Promise.all([
        supabase
            .from('user_profiles')
            .select('user_id, username')
            .in('user_id', friendUserIds),
        Promise.all(
            friendUserIds.map((id) => adminClient.auth.admin.getUserById(id))
        ),
    ]);

    const profileByUserId = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    const adminByUserId = new Map(
        adminResults.flatMap((r) =>
            r.data.user ? [[r.data.user.id, r.data.user]] : []
        )
    );

    const entries: FriendEntry[] = [];
    for (const f of friends) {
        const otherId =
            f.requester_id === userId ? f.addressee_id : f.requester_id;
        const profile = profileByUserId.get(otherId);
        if (!profile) continue;
        const adminUser = adminByUserId.get(otherId);
        entries.push({
            friendship: f,
            username: profile.username,
            avatarUrl:
                typeof adminUser?.user_metadata?.avatar_url === 'string'
                    ? adminUser.user_metadata.avatar_url
                    : undefined,
            fullName:
                typeof adminUser?.user_metadata?.full_name === 'string'
                    ? adminUser.user_metadata.full_name
                    : undefined,
        });
    }

    return entries;
}

/**
 * Cancels a pending friend request sent by the authenticated user.
 *
 * @param friendshipId - UUID of the friendship record.
 * @param addresseeId - Supabase user ID of the recipient (used to revalidate their profile).
 */
export async function cancelFriendRequest(
    friendshipId: string,
    addresseeId?: string
): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser();

    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .eq('requester_id', userId)
        .eq('status', 'pending');

    if (error) throw new Error(error.message);

    await revalidateProfile(supabase, addresseeId);
}

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
 * Sends a friend request from the authenticated user to another user.
 *
 * @param addresseeId - Supabase user ID of the recipient.
 * @throws Error('SELF_REQUEST') if trying to friend oneself.
 * @throws Error('DUPLICATE_REQUEST') if a request already exists.
 */
export async function sendFriendRequest(addresseeId: string): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser();

    if (addresseeId === userId) throw new Error('SELF_REQUEST');

    const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: userId, addressee_id: addresseeId });

    if (error) {
        if (error.code === '23505') throw new Error('DUPLICATE_REQUEST');
        throw new Error(error.message);
    }

    await revalidateProfile(supabase, addresseeId);
}

/**
 * Accepts a pending friend request addressed to the authenticated user.
 *
 * @param friendshipId - UUID of the friendship record.
 * @param requesterId - Supabase user ID of the requester (used to revalidate their profile).
 */
export async function acceptFriendRequest(
    friendshipId: string,
    requesterId?: string
): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser();

    const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .eq('addressee_id', userId)
        .eq('status', 'pending');

    if (error) throw new Error(error.message);

    await revalidateProfile(supabase, requesterId);
}

/**
 * Rejects a pending friend request addressed to the authenticated user.
 *
 * @param friendshipId - UUID of the friendship record.
 * @param requesterId - Supabase user ID of the requester (used to revalidate their profile).
 */
export async function rejectFriendRequest(
    friendshipId: string,
    requesterId?: string
): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser();

    const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .eq('addressee_id', userId)
        .eq('status', 'pending');

    if (error) throw new Error(error.message);

    await revalidateProfile(supabase, requesterId);
}

/**
 * Removes an accepted friendship where the authenticated user is one of the parties.
 *
 * @param friendshipId - UUID of the friendship record.
 * @param otherUserId - Supabase user ID of the other party (used to revalidate their profile).
 */
export async function removeFriend(
    friendshipId: string,
    otherUserId?: string
): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser();

    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) throw new Error(error.message);

    await revalidateProfile(supabase, otherUserId);
}
