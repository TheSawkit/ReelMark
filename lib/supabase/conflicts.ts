/**
 * UNIQUE constraints every upsert targets, one entry per table. A mistyped column list only
 * fails at runtime, so the schema is spelled out here once instead of in each Server Action.
 */
export const ON_CONFLICT = {
	watchlist: 'user_id,media_id,media_type',
	reviews: 'user_id,media_id,media_type',
	recommendationDismissals: 'user_id,media_id,media_type',
	episodeWatches: 'user_id,tv_id,season_number,episode_number',
	playlistItems: 'playlist_id,media_id,media_type',
	userProfiles: 'user_id',
	notificationPreferences: 'user_id',
	userPrompts: 'user_id,prompt_key',
	pushSubscriptions: 'endpoint',
} as const;
