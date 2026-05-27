'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { WatchlistSection } from './WatchlistSection'
import { ReviewsSection } from './ReviewsSection'
import { PlaylistsSection } from './PlaylistsSection'
import { FriendsSection } from './FriendsSection'
import type { WatchlistEntry } from '@/types/tmdb'
import type { PrivacySettings, Review, Playlist, FriendEntry } from '@/types/profile'
import { useTranslation } from '@/lib/i18n/context'
import { canViewWithVisibility } from '@/lib/privacy'

type ProfileTab = 'watchlist' | 'watched' | 'reviews' | 'playlists' | 'friends'

interface ProfileTabsProps {
    toWatch: WatchlistEntry[]
    watched: WatchlistEntry[]
    reviews: Review[]
    initialReviewsCursor: string | null
    profileUserId: string
    playlists: Playlist[]
    friends: FriendEntry[]
    privacy: PrivacySettings
    isOwnProfile: boolean
    isFriend: boolean
}

export function ProfileTabs({
    toWatch,
    watched,
    reviews,
    initialReviewsCursor,
    profileUserId,
    playlists,
    friends,
    privacy,
    isOwnProfile,
    isFriend,
}: ProfileTabsProps) {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<ProfileTab>('watchlist')

    const viewCtx = { isOwn: isOwnProfile, isFriend }

    const TABS: Array<{ id: ProfileTab; label: string; count: number | null }> = [
        { id: 'watchlist', label: t.profile.tabs.watchlist, count: toWatch.length },
        { id: 'watched', label: t.profile.tabs.watched, count: watched.length },
        { id: 'reviews', label: t.profile.tabs.reviews, count: reviews.length },
        { id: 'playlists', label: t.profile.tabs.playlists, count: playlists.length },
        { id: 'friends', label: t.profile.tabs.friends, count: friends.length },
    ]

    return (
        <div>
            <nav
                className="flex gap-1 border-b border-border-subtle mb-6 overflow-y-hidden overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none"
                aria-label={t.profile.profileNav}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer focus-visible:outline-none',
                            activeTab === tab.id
                                ? 'border-primary text-text'
                                : 'border-transparent text-muted hover:text-text'
                        )}
                    >
                        {tab.label}
                        {tab.count !== null && tab.count > 0 && (
                            <span className="text-xs bg-surface-2 text-muted px-1.5 py-0.5 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {activeTab === 'watchlist' && (
                <WatchlistSection
                    entries={toWatch}
                    visibility={privacy.watchlist_visibility}
                    canView={canViewWithVisibility(privacy.watchlist_visibility, viewCtx)}
                    isOwnProfile={isOwnProfile}
                    sectionKey="profile-watchlist"
                />
            )}
            {activeTab === 'watched' && (
                <WatchlistSection
                    entries={watched}
                    visibility={privacy.watched_visibility}
                    canView={canViewWithVisibility(privacy.watched_visibility, viewCtx)}
                    isOwnProfile={isOwnProfile}
                    sectionKey="profile-watched"
                />
            )}
            {activeTab === 'reviews' && (
                <ReviewsSection
                    reviews={reviews}
                    initialNextCursor={initialReviewsCursor}
                    profileUserId={profileUserId}
                    visibility={privacy.reviews_visibility}
                    canView={canViewWithVisibility(privacy.reviews_visibility, viewCtx)}
                    isOwnProfile={isOwnProfile}
                />
            )}
            {activeTab === 'playlists' && (
                <PlaylistsSection
                    playlists={playlists}
                    defaultVisibility={privacy.playlists_visibility}
                    isOwnProfile={isOwnProfile}
                />
            )}
            {activeTab === 'friends' && (
                <FriendsSection
                    friends={friends}
                    visibility={privacy.friends_visibility}
                    canView={canViewWithVisibility(privacy.friends_visibility, viewCtx)}
                />
            )}
        </div>
    )
}
