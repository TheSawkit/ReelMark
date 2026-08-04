'use server';

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { ON_CONFLICT } from '@/lib/supabase/conflicts';

const MAX_ENDPOINT_LENGTH = 1000;
const MAX_KEY_LENGTH = 255;
const MAX_USER_AGENT_LENGTH = 500;

export interface PushSubscriptionInput {
	endpoint: string;
	p256dh: string;
	auth: string;
	userAgent?: string;
}

function isValidSubscription(input: PushSubscriptionInput): boolean {
	return (
		typeof input.endpoint === 'string' &&
		input.endpoint.startsWith('https://') &&
		input.endpoint.length <= MAX_ENDPOINT_LENGTH &&
		typeof input.p256dh === 'string' &&
		input.p256dh.length > 0 &&
		input.p256dh.length <= MAX_KEY_LENGTH &&
		typeof input.auth === 'string' &&
		input.auth.length > 0 &&
		input.auth.length <= MAX_KEY_LENGTH
	);
}

/** Stores a browser push subscription for the authenticated user, keyed by endpoint. */
export async function savePushSubscription(
	input: PushSubscriptionInput
): Promise<void> {
	if (!isValidSubscription(input)) throw new Error('Invalid subscription');

	const { supabase, userId } = await getAuthenticatedUser();

	const { error } = await supabase.from('push_subscriptions').upsert(
		{
			user_id: userId,
			endpoint: input.endpoint,
			p256dh: input.p256dh,
			auth: input.auth,
			user_agent:
				input.userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
		},
		{ onConflict: ON_CONFLICT.pushSubscriptions }
	);

	if (error) throw new Error(error.message);
}

/** Removes a push subscription when the user turns notifications off or the browser rotates it. */
export async function deletePushSubscription(endpoint: string): Promise<void> {
	const { supabase, userId } = await getAuthenticatedUser();

	const { error } = await supabase
		.from('push_subscriptions')
		.delete()
		.eq('endpoint', endpoint)
		.eq('user_id', userId);

	if (error) throw new Error(error.message);
}
