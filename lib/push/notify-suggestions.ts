import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns';
import { mapLimit } from '@/lib/data-transfer/resolve';
import { getUserReviewSignals } from '@/lib/data/reviews';
import { getUserTvWatchCounts } from '@/lib/data/episodes';
import {
	getMovieRecommendations,
	getTvShowRecommendations,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import { pickSeeds, pickSuggestion } from '@/lib/recommendations';
import { translations, type Language } from '@/lib/i18n/translations';
import { localizedHref } from '@/lib/i18n/utils';
import { reportSwallowed } from '@/lib/report';
import { recipientLanguage } from '@/lib/push/notify-friend';
import { sendPushToUser } from '@/lib/push/send';
import type { MediaItem, MediaType, WatchlistEntry } from '@/types/tmdb';

const USER_CONCURRENCY = 3;
const MEDIA_TYPES: MediaType[] = ['movie', 'tv'];

export interface SuggestionResult {
	users: number;
	suggested: number;
}

async function candidatesFor(
	type: MediaType,
	entries: WatchlistEntry[],
	ratingByKey: Record<string, number>,
	episodesWatched: Record<number, number>,
	ratedAtByKey: Record<string, string>,
	lang: Language
) {
	const seeds = pickSeeds(
		entries,
		ratingByKey,
		episodesWatched,
		ratedAtByKey
	);
	return Promise.all(
		seeds.map(async ({ entry, weight }) => ({
			weight,
			items:
				type === 'movie'
					? (await getMovieRecommendations(entry.media_id, lang)).map(
							movieToMediaItem
						)
					: (
							await getTvShowRecommendations(entry.media_id, lang)
						).map(tvShowToMediaItem),
		}))
	);
}

async function suggestionFor(
	userId: string,
	lang: Language
): Promise<MediaItem | null> {
	const admin = createAdminClient();

	const [
		rows,
		{ ratings: ratingByKey, ratedAt: ratedAtByKey },
		dismissals,
		past,
	] = await Promise.all([
		fetchAllRows((from, to) =>
			admin
				.from('watchlist')
				.select(WATCHLIST_COLUMNS)
				.eq('user_id', userId)
				.order('id')
				.range(from, to)
		),
		getUserReviewSignals(userId, admin),
		admin
			.from('recommendation_dismissals')
			.select('media_id, media_type, genre_ids')
			.eq('user_id', userId),
		admin
			.from('notifications')
			.select('media_id, media_type')
			.eq('user_id', userId)
			.eq('type', 'suggestion'),
	]);
	const entries = rows as WatchlistEntry[];
	const episodesWatched = await getUserTvWatchCounts(
		admin,
		userId,
		entries
			.filter(
				(entry) =>
					entry.media_type === 'tv' && entry.status === 'to_watch'
			)
			.map((entry) => entry.media_id)
	);
	const alreadySuggested = new Set(
		(past.data ?? []).map((row) => `${row.media_type}-${row.media_id}`)
	);

	for (const type of MEDIA_TYPES) {
		const typeEntries = entries.filter(
			(entry) => entry.media_type === type
		);
		if (typeEntries.length === 0) continue;

		const pick = pickSuggestion(
			typeEntries,
			ratingByKey,
			(dismissals.data ?? [])
				.filter((row) => row.media_type === type)
				.map((row) => ({ ...row, media_type: type })),
			await candidatesFor(
				type,
				typeEntries,
				ratingByKey,
				episodesWatched,
				ratedAtByKey,
				lang
			),
			alreadySuggested,
			episodesWatched
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
