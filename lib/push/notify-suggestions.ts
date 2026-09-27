import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { mapLimit } from '@/lib/data-transfer/resolve';
import { loadUserTaste, tasteOfType } from '@/lib/data/taste';
import { pickSeeds, pickSuggestion } from '@/lib/recommendations';
import { fetchSeedCandidates } from '@/lib/recommendations/candidates';
import { translations, type Language } from '@/lib/i18n/translations';
import { localizedHref } from '@/lib/i18n/utils';
import { reportSwallowed } from '@/lib/report';
import { recipientLanguage } from '@/lib/push/notify-friend';
import { sendPushToUser } from '@/lib/push/send';
import type { MediaItem, MediaType } from '@/types/tmdb';

const USER_CONCURRENCY = 3;
const MEDIA_TYPES: MediaType[] = ['movie', 'tv'];

export interface SuggestionResult {
	users: number;
	suggested: number;
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
	const alreadySuggested = new Set(
		(past.data ?? []).map((row) => `${row.media_type}-${row.media_id}`)
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

/**
 * Sends each user one personalized title a week, picked by the dashboard's ranking and never
 * repeated, honouring the `suggestions` preference. `dryRun` counts without writing or pushing.
 */
export async function sendWeeklySuggestions(
	dryRun = false
): Promise<SuggestionResult> {
	const admin = createAdminClient();

	const [{ data: profiles }, { data: optOuts }] = await Promise.all([
		admin.from('user_profiles').select('user_id'),
		admin
			.from('notification_preferences')
			.select('user_id')
			.eq('suggestions', false),
	]);
	const optedOut = new Set((optOuts ?? []).map((row) => row.user_id));
	const userIds = (profiles ?? [])
		.map((row) => row.user_id)
		.filter((userId) => !optedOut.has(userId));

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
	};
}
