import type { AppNotification, NotificationType } from '@/types/notifications';

type Templates = Record<NotificationType, string>;

/** Builds the human-readable sentence for a notification from i18n templates. */
export function notificationMessage(
	n: AppNotification,
	templates: Templates
): string {
	return templates[n.type]
		.replace('{user}', n.senderUsername ?? '')
		.replace('{title}', n.mediaTitle ?? '')
		.replace('{season}', String(n.seasonNumber ?? ''))
		.replace('{episode}', String(n.episodeNumber ?? ''));
}

/** Maps a Supabase notifications row to the camelCase app shape. */
export function rowToAppNotification(row: {
	id: string;
	type: string;
	sender_username: string | null;
	media_id: number | null;
	media_type: string | null;
	media_title: string | null;
	poster_path: string | null;
	season_number: number | null;
	episode_number: number | null;
	url: string | null;
	read_at: string | null;
	created_at: string;
}): AppNotification {
	return {
		id: row.id,
		type: row.type as NotificationType,
		senderUsername: row.sender_username,
		mediaId: row.media_id,
		mediaType: row.media_type as 'movie' | 'tv' | null,
		mediaTitle: row.media_title,
		posterPath: row.poster_path,
		seasonNumber: row.season_number,
		episodeNumber: row.episode_number,
		url: row.url,
		readAt: row.read_at,
		createdAt: row.created_at,
	};
}
