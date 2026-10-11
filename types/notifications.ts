export const NOTIFICATION_TYPES = [
	'friend_request',
	'friend_accepted',
	'new_episode',
	'suggestion',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AppNotification {
	id: string;
	type: NotificationType;
	senderUsername: string | null;
	senderAvatarUrl: string | null;
	mediaId: number | null;
	mediaType: 'movie' | 'tv' | null;
	mediaTitle: string | null;
	posterPath: string | null;
	seasonNumber: number | null;
	episodeNumber: number | null;
	url: string | null;
	readAt: string | null;
	createdAt: string;
}

/** An optimistic write already shown on screen: `undo` reverts it without any request; `confirm`, when present, completes it once the server accepted it. */
export interface OptimisticChange {
	confirm?: () => void;
	undo: () => void;
}

export interface NotificationPreferences {
	friend_requests: boolean;
	friend_accepted: boolean;
	new_episodes: boolean;
	suggestions: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
	friend_requests: true,
	friend_accepted: true,
	new_episodes: true,
	suggestions: true,
};
