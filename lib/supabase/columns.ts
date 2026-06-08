export const WATCHLIST_COLUMNS =
	'id, user_id, media_id, media_title, media_type, poster_path, status, created_at, total_episodes';
export const REVIEW_COLUMNS =
	'id, user_id, media_id, media_type, media_title, poster_path, rating, content, created_at, updated_at';
export const USER_PROFILE_COLUMNS =
	'user_id, username, bio, instagram, tiktok, letterboxd, twitter, website, created_at, updated_at';
export const PRIVACY_COLUMNS =
	'user_id, watchlist_visibility, watched_visibility, reviews_visibility, playlists_visibility, friends_visibility';
export const FRIENDSHIP_COLUMNS =
	'id, requester_id, addressee_id, status, created_at, updated_at';
