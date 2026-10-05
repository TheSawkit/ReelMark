import 'server-only';
import { translations, type Language } from '@/lib/i18n/translations';
import { DEFAULT_LANGUAGE } from '@/lib/i18n/config';
import { getAccountLocale } from '@/lib/data/mcp';
import { localizedHref } from '@/lib/i18n/utils';
import { reportSwallowed } from '@/lib/report';
import { sendPushToUser } from '@/lib/push/send';

type FriendPushType = 'friend_request' | 'friend_accepted';

/** The recipient's UI language, so a push reads like the rest of their app. */
export async function recipientLanguage(userId: string): Promise<Language> {
	try {
		return (await getAccountLocale(userId)).lang;
	} catch (error) {
		reportSwallowed('push:recipient-language', error);
		return DEFAULT_LANGUAGE;
	}
}

/**
 * Pushes a friend request/acceptance to the recipient's devices, in their own language.
 * Mirrors the row the `notify_friend_event` trigger writes, so the in-app bell and the
 * push notification always say the same thing.
 *
 * @param recipientId - User receiving the notification.
 * @param senderUsername - Username shown in the message.
 */
export async function sendFriendPush(
	recipientId: string,
	senderUsername: string | null,
	type: FriendPushType
): Promise<void> {
	const lang = await recipientLanguage(recipientId);
	const t = translations[lang];

	const body = t.notifications.templates[type].replace(
		'{user}',
		senderUsername ?? ''
	);

	await sendPushToUser(recipientId, type, {
		title: 'ReelMark',
		body,
		url: localizedHref(
			lang,
			senderUsername ? `/profile/${senderUsername}` : '/notifications'
		),
		tag: `${type}:${senderUsername ?? ''}`,
	});
}
