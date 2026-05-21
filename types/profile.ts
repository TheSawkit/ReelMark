export const MAX_REVIEW_LENGTH = 65000

export type PrivacyVisibility = 'public' | 'friends' | 'private'

export interface UserProfile {
  user_id: string
  username: string
  bio: string | null
  instagram: string | null
  tiktok: string | null
  letterboxd: string | null
  twitter: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface PrivacySettings {
  user_id: string
  watchlist_visibility: PrivacyVisibility
  watched_visibility: PrivacyVisibility
  reviews_visibility: PrivacyVisibility
  playlists_visibility: PrivacyVisibility
  friends_visibility: PrivacyVisibility
}

import type { MediaType } from '@/types/tmdb'

export type ReviewMediaType = MediaType | 'episode'

export interface Review {
  id: string
  user_id: string
  media_id: number
  media_type: ReviewMediaType
  media_title: string
  poster_path: string | null
  rating: number | null
  content: string | null
  created_at: string
  updated_at: string
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  items?: PlaylistItem[]
}

export type PlaylistMediaType = 'movie' | 'tv'

export interface PlaylistItem {
  id: string
  playlist_id: string
  media_id: number
  media_type: PlaylistMediaType
  media_title: string
  poster_path: string | null
  added_at: string
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export interface PublicReview {
  id: string
  user_id: string
  media_id: number
  username: string
  avatar_url: string | null
  rating: number | null
  content: string | null
  created_at: string
}

export interface UserReviewsPage {
  reviews: Review[]
  nextCursor: string | null
}

export type PrivacyDefaults = Omit<PrivacySettings, 'user_id'>

export interface FriendEntry {
  friendship: Friendship
  username: string
  avatarUrl?: string
  fullName?: string
}
