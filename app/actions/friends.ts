'use server'

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers'
import { FRIENDSHIP_COLUMNS } from '@/lib/supabase/columns'
import type { Friendship } from '@/types/profile'

/**
 * Returns accepted friendships for a given user (both directions), up to 100.
 *
 * @param userId - Supabase user ID.
 * @returns Array of accepted Friendship records.
 */
export async function getFriends(userId: string): Promise<Friendship[]> {
    const { supabase } = await getAuthenticatedUser()

    const { data, error } = await supabase
        .from('friendships')
        .select(FRIENDSHIP_COLUMNS)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')
        .limit(100)

    if (error) throw new Error(error.message)
    return (data as Friendship[]) ?? []
}

/**
 * Returns pending friend requests addressed to the authenticated user.
 *
 * @returns Array of pending Friendship records.
 */
export async function getPendingRequests(): Promise<Friendship[]> {
    const { supabase, userId } = await getAuthenticatedUser()

    const { data, error } = await supabase
        .from('friendships')
        .select(FRIENDSHIP_COLUMNS)
        .eq('addressee_id', userId)
        .eq('status', 'pending')
        .limit(100)

    if (error) throw new Error(error.message)
    return (data as Friendship[]) ?? []
}

/**
 * Returns the friendship record between the authenticated user and a target user, or null.
 *
 * @param targetUserId - Supabase user ID of the other party.
 * @returns Friendship or null.
 */
export async function getFriendshipStatus(targetUserId: string): Promise<Friendship | null> {
    const { supabase, userId } = await getAuthenticatedUser()

    const { data } = await supabase
        .from('friendships')
        .select(FRIENDSHIP_COLUMNS)
        .or(
            `and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),` +
            `and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`
        )
        .maybeSingle()

    return (data as Friendship) ?? null
}

/**
 * Sends a friend request from the authenticated user to another user.
 *
 * @param addresseeId - Supabase user ID of the recipient.
 */
export async function sendFriendRequest(addresseeId: string): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser()

    const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: userId, addressee_id: addresseeId })

    if (error) throw new Error(error.message)
}

/**
 * Accepts a pending friend request addressed to the authenticated user.
 *
 * @param friendshipId - UUID of the friendship record.
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser()

    const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .eq('addressee_id', userId)

    if (error) throw new Error(error.message)
}

/**
 * Rejects a pending friend request addressed to the authenticated user.
 *
 * @param friendshipId - UUID of the friendship record.
 */
export async function rejectFriendRequest(friendshipId: string): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser()

    const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .eq('addressee_id', userId)

    if (error) throw new Error(error.message)
}

/**
 * Removes an accepted friendship where the authenticated user is one of the parties.
 *
 * @param friendshipId - UUID of the friendship record.
 */
export async function removeFriend(friendshipId: string): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser()

    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

    if (error) throw new Error(error.message)
}
