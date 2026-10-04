import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { mapLimit } from '@/lib/data-transfer/resolve';
import { getTvShowDetails } from '@/lib/tmdb/tv';
import { translations } from '@/lib/i18n/translations';
import { localizedHref } from '@/lib/i18n/utils';
import { reportSwallowed } from '@/lib/report';
import { isFreshEpisode, recipientsFor } from '@/lib/new-episodes';
import { recipientLanguage } from '@/lib/push/notify-friend';
import { sendPushToUser } from '@/lib/push/send';

const FOLLOWING_STATUSES = ['to_watch', 'watched'];
const TMDB_CONCURRENCY = 6;

interface FollowRow {
	user_id: string;
	media_id: number;
	media_title: string;
	poster_path: string | null;
}

interface ShowOutcome {
	fresh: boolean;
	notified: number;
}

const NOT_FRESH: ShowOutcome = { fresh: false, notified: 0 };

export interface AnnounceResult {
	shows: number;
	freshEpisodes: number;
	notified: number;
}

async function pushNewEpisode(
	follow: FollowRow,
	season: number,
	episode: number
): Promise<void> {
	const lang = await recipientLanguage(follow.user_id);
	const body = translations[lang].notifications.templates.new_episode
		.replace('{title}', follow.media_title)
		.replace('{season}', String(season))
		.replace('{episode}', String(episode));

	await sendPushToUser(follow.user_id, 'new_episode', {
		title: 'ReelMark',
		body,
		url: localizedHref(lang, `/tv/${follow.media_id}/season/${season}`),
		tag: `new_episode:${follow.media_id}:${season}:${episode}`,
	});
}

/**
 * Notifies every follower of a show whose latest episode aired within the catch-up window,
 * once per user and episode, honouring the `new_episodes` preference. `dryRun` counts without
 * writing or pushing, so a deployment can be checked against real data.
 */
export async function announceNewEpisodes(
	today: string,
	dryRun = false
): Promise<AnnounceResult> {
	const admin = createAdminClient();

	const follows = await fetchAllRows<FollowRow>((from, to) =>
		admin
			.from('watchlist')
			.select('user_id, media_id, media_title, poster_path')
			.eq('media_type', 'tv')
			.in('status', FOLLOWING_STATUSES)
			.order('id')
			.range(from, to)
	);

	const optOuts = await fetchAllRows((from, to) =>
		admin
			.from('notification_preferences')
			.select('user_id')
			.eq('new_episodes', false)
			.order('user_id')
			.range(from, to)
	);
	const optedOut = new Set(optOuts.map((row) => row.user_id));

	const followsByShow = new Map<number, FollowRow[]>();
	for (const follow of follows) {
		followsByShow.set(follow.media_id, [
			...(followsByShow.get(follow.media_id) ?? []),
			follow,
		]);
	}

	const perShow = await mapLimit(
		[...followsByShow],
		TMDB_CONCURRENCY,
		async ([tvId, showFollows]): Promise<ShowOutcome> => {
			try {
				const { last_episode_to_air: aired } = await getTvShowDetails(
					tvId,
					'en'
				);
				if (!aired || !isFreshEpisode(aired.air_date, today))
					return NOT_FRESH;

				const { data: sent } = await admin
					.from('notifications')
					.select('user_id')
					.eq('type', 'new_episode')
					.eq('media_id', tvId)
					.eq('season_number', aired.season_number)
					.eq('episode_number', aired.episode_number);

				const recipientIds = new Set(
					recipientsFor(
						showFollows.map((follow) => follow.user_id),
						optedOut,
						new Set((sent ?? []).map((row) => row.user_id))
					)
				);
				const recipients = showFollows.filter((follow) =>
					recipientIds.has(follow.user_id)
				);
				if (dryRun || recipients.length === 0)
					return { fresh: true, notified: recipients.length };

				const { error } = await admin.from('notifications').insert(
					recipients.map((follow) => ({
						user_id: follow.user_id,
						sender_id: follow.user_id,
						type: 'new_episode',
						media_id: tvId,
						media_type: 'tv',
						media_title: follow.media_title,
						poster_path: follow.poster_path,
						season_number: aired.season_number,
						episode_number: aired.episode_number,
						url: `/tv/${tvId}/season/${aired.season_number}`,
					}))
				);
				if (error) throw new Error(error.message);

				await Promise.all(
					recipients.map((follow) =>
						pushNewEpisode(
							follow,
							aired.season_number,
							aired.episode_number
						)
					)
				);
				return { fresh: true, notified: recipients.length };
			} catch (error) {
				reportSwallowed('notifications:new-episodes', error);
				return NOT_FRESH;
			}
		}
	);

	return {
		shows: followsByShow.size,
		freshEpisodes: perShow.filter((outcome) => outcome.fresh).length,
		notified: perShow.reduce((sum, outcome) => sum + outcome.notified, 0),
	};
}
