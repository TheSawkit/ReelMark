import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { mapLimit } from '@/lib/data-transfer/resolve';
import { loadUserTaste, tasteOfType } from '@/lib/data/taste';
import { pickSeeds, pickSuggestion } from '@/lib/recommendations';
import { fetchSeedCandidates } from '@/lib/recommendations/candidates';
import { MEDIA_TYPES } from '@/lib/validators';
import { translations, type Language } from '@/lib/i18n/translations';
import { localizedHref } from '@/lib/i18n/utils';
import { reportSwallowed } from '@/lib/report';
import { recipientLanguage } from '@/lib/push/notify-friend';
import { sendPushToUser } from '@/lib/push/send';
import type { MediaItem } from '@/types/tmdb';

const USER_CONCURRENCY = 3;
const RESEND_AFTER_MS = 6 * 86_400_000;
const BATCH_SIZE = 50;

export interface SuggestionResult {
	users: number;
	suggested: number;
	/** Last account of this batch, to pass as `after` for the next one; null once every account is done. */
	nextCursor: string | null;
}

async function suggestionFor(
	userId: string,
	lang: Language
): Promise<MediaItem | null> {
	const admin = createAdminClient();

	const [taste, past] = await Promise.all([
		loadUserTaste(admin, userId),
		admin
			.from('notifications')
			.select('media_id, media_type')
			.eq('user_id', userId)
			.eq('type', 'suggestion'),
	]);
	if (past.error) throw new Error(past.error.message);
	const alreadySuggested = new Set(
		past.data.map((row) => `${row.media_type}-${row.media_id}`)
	);

	for (const type of MEDIA_TYPES) {
		const { entries, dismissals } = tasteOfType(taste, type);
		if (entries.length === 0) continue;

		const pick = pickSuggestion(
			entries,
			taste.profile,
			dismissals,
			await fetchSeedCandidates(
				type,
				pickSeeds(entries, taste.profile),
				lang
			),
			alreadySuggested
		);
		if (pick) return pick;
	}
	return null;
}

/** Every account to suggest to this week: not opted out, and not already served — so a retried job never sends a second suggestion. */
export function usersToSuggest(
	profiles: ReadonlyArray<{ user_id: string }>,
	skipped: ReadonlyArray<{ user_id: string }>
): string[] {
	const skippedIds = new Set(skipped.map((row) => row.user_id));
	return profiles
		.map((row) => row.user_id)
		.filter((userId) => !skippedIds.has(userId));
}

/**
 * Sends one batch of accounts their personalized title of the week, picked by the dashboard's
 * ranking and never repeated, honouring the `suggestions` preference. Accounts go in `user_id`
 * order, `BATCH_SIZE` at a time from `after`, so each call stays short whatever the user count;
 * the caller loops on `nextCursor`. A failed read fails the batch: an empty list must not pass
 * for "nobody to notify". `dryRun` counts without writing or pushing.
 */
export async function sendWeeklySuggestions(
	dryRun = false,
	after?: string
): Promise<SuggestionResult> {
	const admin = createAdminClient();

	const accounts = admin
		.from('user_profiles')
		.select('user_id')
		.order('user_id')
		.limit(BATCH_SIZE);
	const { data: profiles, error } = await (after
		? accounts.gt('user_id', after)
		: accounts);
	if (error) throw new Error(error.message);
	if (profiles.length === 0)
		return { users: 0, suggested: 0, nextCursor: null };

	const ids = profiles.map((row) => row.user_id);
	const since = new Date(Date.now() - RESEND_AFTER_MS).toISOString();
	const [optOuts, recent] = await Promise.all([
		admin
			.from('notification_preferences')
			.select('user_id')
			.eq('suggestions', false)
			.in('user_id', ids),
		admin
			.from('notifications')
			.select('user_id')
			.eq('type', 'suggestion')
			.gte('created_at', since)
			.in('user_id', ids),
	]);
	if (optOuts.error) throw new Error(optOuts.error.message);
	if (recent.error) throw new Error(recent.error.message);
	const userIds = usersToSuggest(profiles, [...optOuts.data, ...recent.data]);

	const sent = await mapLimit(userIds, USER_CONCURRENCY, async (userId) => {
		try {
			const lang = await recipientLanguage(userId);
			const pick = await suggestionFor(userId, lang);
			if (!pick) return false;
			if (dryRun) return true;

			const url = `/${pick.media_type}/${pick.id}`;
			const { error } = await admin.from('notifications').insert({
				user_id: userId,
				sender_id: userId,
				type: 'suggestion',
				media_id: pick.id,
				media_type: pick.media_type,
				media_title: pick.title,
				poster_path: pick.poster_path,
				url,
			});
			if (error) throw new Error(error.message);

			await sendPushToUser(userId, 'suggestion', {
				title: 'ReelMark',
				body: translations[
					lang
				].notifications.templates.suggestion.replace(
					'{title}',
					pick.title
				),
				url: localizedHref(lang, url),
				tag: `suggestion:${pick.media_type}:${pick.id}`,
			});
			return true;
		} catch (error) {
			reportSwallowed('notifications:suggestions', error);
			return false;
		}
	});

	return {
		users: userIds.length,
		suggested: sent.filter(Boolean).length,
		nextCursor: ids.length === BATCH_SIZE ? ids[ids.length - 1] : null,
	};
}
