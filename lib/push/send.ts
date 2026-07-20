import 'server-only';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/server';
import { reportSwallowed } from '@/lib/report';
import type { NotificationType } from '@/types/notifications';

export interface PushPayload {
	title: string;
	body: string;
	url: string;
	icon?: string;
	tag?: string;
}

const PREFERENCE_BY_TYPE: Record<
	NotificationType,
	'friend_requests' | 'friend_accepted' | 'new_episodes' | 'suggestions'
> = {
	friend_request: 'friend_requests',
	friend_accepted: 'friend_accepted',
	new_episode: 'new_episodes',
	suggestion: 'suggestions',
};

const GONE_STATUS_CODES = new Set([404, 410]);

function configuredWebPush(): typeof webpush | null {
	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	const subject = process.env.VAPID_SUBJECT;
	if (!publicKey || !privateKey || !subject) return null;

	webpush.setVapidDetails(subject, publicKey, privateKey);
	return webpush;
}

/**
 * Sends a web push notification to every device of a user, honouring their notification
 * preferences. Never throws — push is best-effort and must not fail the calling mutation.
 *
 * @param userId - Recipient.
 * @param type - Notification type, matched against the user's preferences.
 * @param payload - Content rendered by the service worker.
 */
export async function sendPushToUser(
	userId: string,
	type: NotificationType,
	payload: PushPayload
): Promise<void> {
	const push = configuredWebPush();
	if (!push) return;

	try {
		const supabase = createAdminClient();

		const { data: preferences } = await supabase
			.from('notification_preferences')
			.select(
				'friend_requests, friend_accepted, new_episodes, suggestions'
			)
			.eq('user_id', userId)
			.maybeSingle();

		if (preferences && preferences[PREFERENCE_BY_TYPE[type]] === false)
			return;

		const { data: subscriptions } = await supabase
			.from('push_subscriptions')
			.select('endpoint, p256dh, auth')
			.eq('user_id', userId);

		if (!subscriptions?.length) return;

		const staleEndpoints: string[] = [];

		await Promise.all(
			subscriptions.map(async (subscription) => {
				try {
					await push.sendNotification(
						{
							endpoint: subscription.endpoint,
							keys: {
								p256dh: subscription.p256dh,
								auth: subscription.auth,
							},
						},
						JSON.stringify(payload)
					);
				} catch (error) {
					const statusCode = (error as { statusCode?: number })
						.statusCode;
					if (statusCode && GONE_STATUS_CODES.has(statusCode)) {
						staleEndpoints.push(subscription.endpoint);
						return;
					}
					reportSwallowed('push:send', error);
				}
			})
		);

		if (staleEndpoints.length > 0) {
			await supabase
				.from('push_subscriptions')
				.delete()
				.in('endpoint', staleEndpoints);
		}
	} catch (error) {
		reportSwallowed('push:dispatch', error);
	}
}
