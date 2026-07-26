'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { revalidateProfileAfterResponse } from '@/app/actions/_helpers';
import { sendFriendPush } from '@/lib/push/notify-friend';
import { after } from 'next/server';

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
	const { supabase, userId, user } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('friendships')
		.delete()
		.eq('id', friendshipId)
		.eq('requester_id', userId)
		.eq('status', 'pending');

	if (error) throw new Error(error.message);

	revalidateProfileAfterResponse(supabase, user, addresseeId);
}

/**
 * Sends a friend request from the authenticated user to another user.
 *
 * @param addresseeId - Supabase user ID of the recipient.
 * @throws Error('SELF_REQUEST') if trying to friend oneself.
 * @throws Error('DUPLICATE_REQUEST') if a request already exists.
 */
export async function sendFriendRequest(addresseeId: string): Promise<void> {
	const { supabase, userId, user } = await getAuthenticatedUser();

	if (addresseeId === userId) throw new Error('SELF_REQUEST');

	const { error } = await supabase
		.from('friendships')
		.insert({ requester_id: userId, addressee_id: addresseeId });

	if (error) {
		if (error.code === '23505') throw new Error('DUPLICATE_REQUEST');
		throw new Error(error.message);
	}

	after(() =>
		sendFriendPush(
			addresseeId,
			user.user_metadata.username ?? null,
			'friend_request'
		)
	);
	revalidateProfileAfterResponse(supabase, user, addresseeId);
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
	const { supabase, userId, user } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('friendships')
		.update({ status: 'accepted', updated_at: new Date().toISOString() })
		.eq('id', friendshipId)
		.eq('addressee_id', userId)
		.eq('status', 'pending');

	if (error) throw new Error(error.message);

	if (requesterId) {
		after(() =>
			sendFriendPush(
				requesterId,
				user.user_metadata.username ?? null,
				'friend_accepted'
			)
		);
	}
	revalidateProfileAfterResponse(supabase, user, requesterId);
}

/**
 * Rejects a pending friend request by deleting it, so the pair can request again later.
 *
 * @param friendshipId - UUID of the friendship record.
 * @param requesterId - Supabase user ID of the requester (used to revalidate their profile).
 */
export async function rejectFriendRequest(
	friendshipId: string,
	requesterId?: string
): Promise<void> {
	const { supabase, userId, user } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('friendships')
		.delete()
		.eq('id', friendshipId)
		.eq('addressee_id', userId)
		.eq('status', 'pending');

	if (error) throw new Error(error.message);

	revalidateProfileAfterResponse(supabase, user, requesterId);
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
	const { supabase, userId, user } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('friendships')
		.delete()
		.eq('id', friendshipId)
		.or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

	if (error) throw new Error(error.message);

	revalidateProfileAfterResponse(supabase, user, otherUserId);
}
