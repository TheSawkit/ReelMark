// `user_id` est délibérément absent : il vaut la même chose sur toutes les lignes d'une même
// requête, personne ne le lit sur une entrée, et il pesait ~125 Ko du million d'octets que
// /library sérialise pour une bibliothèque de 2 000 titres.
export const WATCHLIST_COLUMNS =
	'id, media_id, media_title, media_type, poster_path, status, created_at, total_episodes, release_date, genre_ids';
export const REVIEW_COLUMNS =
	'id, user_id, media_id, media_type, media_title, poster_path, rating, content, tv_id, season_number, created_at, updated_at';
export const USER_PROFILE_COLUMNS =
	'user_id, username, bio, instagram, tiktok, letterboxd, twitter, website, avatar_url, onboarding_completed, created_at, updated_at';
export const PRIVACY_COLUMNS =
	'user_id, watchlist_visibility, watched_visibility, reviews_visibility, playlists_visibility, friends_visibility';
export const FRIENDSHIP_COLUMNS =
	'id, requester_id, addressee_id, status, created_at, updated_at';
