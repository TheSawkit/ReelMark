import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { TASTE_COLUMNS } from '@/lib/supabase/columns';
import { getUserReviewSignals } from '@/lib/data/reviews';
import { getUserTvWatchCounts } from '@/lib/data/episodes';
import type {
	DismissedRecommendation,
	TasteProfile,
} from '@/lib/recommendations';
import type { Database } from '@/types/database';
import { getMediaKey } from '@/lib/media';
import type { MediaType, TasteEntry, WatchStatus } from '@/types/tmdb';

export interface UserTaste {
	entries: TasteEntry[];
	profile: TasteProfile;
	dismissals: DismissedRecommendation[];
}

const isShowToWatch = (entry: TasteEntry) =>
	entry.media_type === 'tv' && entry.status === 'to_watch';

const isMediaType = (value: string): value is MediaType =>
	value === 'movie' || value === 'tv';

/** Loads everything the recommendation engine reads about one user through an explicit client — the weekly cron and the MCP endpoint carry no session cookie. */
export async function loadUserTaste(
	client: SupabaseClient<Database>,
	userId: string
): Promise<UserTaste> {
	const entriesRead = fetchAllRows((from, to) =>
		client
			.from('watchlist')
			.select(TASTE_COLUMNS)
			.eq('user_id', userId)
			.order('id')
			.range(from, to)
	).then((rows) => rows as TasteEntry[]);

	const [entries, reviewSignals, episodesWatched, dismissals] =
		await Promise.all([
			entriesRead,
			getUserReviewSignals(userId, client),
			entriesRead.then((rows) =>
				getUserTvWatchCounts(
					client,
					userId,
					rows.filter(isShowToWatch).map((entry) => entry.media_id)
				)
			),
			client
				.from('recommendation_dismissals')
				.select('media_id, media_type, genre_ids')
				.eq('user_id', userId),
		]);

	return {
		entries,
		profile: { ...reviewSignals, episodesWatched },
		dismissals: (dismissals.data ?? []).flatMap(
			({ media_id, media_type, genre_ids }) =>
				isMediaType(media_type)
					? [{ media_id, media_type, genre_ids }]
					: []
		),
	};
}

/** Narrows a user's taste to one media type — every engine ranking runs per type. */
export function tasteOfType(
	taste: UserTaste,
	type: MediaType
): Pick<UserTaste, 'entries' | 'dismissals'> {
	return {
		entries: taste.entries.filter((entry) => entry.media_type === type),
		dismissals: taste.dismissals.filter(
			(dismissal) => dismissal.media_type === type
		),
	};
}

export interface UserMark {
	status?: WatchStatus;
	rating?: number;
}

/** The user's status and rating on a handful of titles, keyed by media key — two targeted reads instead of the whole library. */
export async function loadUserMarks(
	client: SupabaseClient<Database>,
	userId: string,
	items: ReadonlyArray<{ id: number; media_type: MediaType }>
): Promise<Map<string, UserMark>> {
	const marks = new Map<string, UserMark>();
	if (items.length === 0) return marks;
	const ids = [...new Set(items.map(({ id }) => id))];

	const [watchlist, reviews] = await Promise.all([
		client
			.from('watchlist')
			.select('media_id, media_type, status')
			.eq('user_id', userId)
			.in('media_id', ids),
		client
			.from('reviews')
			.select('media_id, media_type, rating')
			.eq('user_id', userId)
			.in('media_id', ids)
			.in('media_type', ['movie', 'tv'])
			.not('rating', 'is', null),
	]);

	const markOf = (mediaType: string, id: number) => {
		const key = getMediaKey({ media_type: mediaType as MediaType, id });
		const mark = marks.get(key) ?? {};
		marks.set(key, mark);
		return mark;
	};
	for (const row of watchlist.data ?? []) {
		markOf(row.media_type, row.media_id).status = row.status as WatchStatus;
	}
	for (const row of reviews.data ?? []) {
		if (row.rating !== null)
			markOf(row.media_type, row.media_id).rating = row.rating;
	}
	return marks;
}
