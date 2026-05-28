import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getTranslations } from '@/lib/i18n/server'
import { PageLayout } from '@/components/layout/PageLayout'
import { ProfileHero } from '@/components/profile/ProfileHero'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { FriendshipButton } from '@/components/profile/FriendshipButton'
import { ProfileOptionsMenu } from '@/components/profile/ProfileOptionsMenu'
import { getProfileByUsername, getPrivacySettings } from '@/app/actions/profile'
import { getUserReviews } from '@/app/actions/reviews'
import { getUserPlaylists } from '@/app/actions/playlists'
import { getFriendsWithProfiles, getFriendshipStatus, getPendingRequestsWithProfiles } from '@/app/actions/friends'
import type { WatchlistEntry } from '@/types/tmdb'
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns'

interface Props {
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<import("next").Metadata> {
    const { username } = await params
    const t = await getTranslations()
    const description = t.metadata.profileDescription.replace('${username}', username)
    return {
        title: `@${username}`,
        description,
        robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
        openGraph: {
            title: `@${username} — ReelMark`,
            description,
            type: 'profile',
        },
        twitter: {
            card: 'summary',
            title: `@${username} — ReelMark`,
            description,
        },
    }
}

export default async function ProfilePage({ params }: Props) {
    const { username } = await params

    const [currentUser, profile] = await Promise.all([
        requireAuth(),
        getProfileByUsername(username),
    ])
    if (!profile) notFound()

    const isOwnProfile = currentUser.id === profile.user_id

    const supabase = await createClient()
    const adminClient = createAdminClient()

    const [privacy, reviewsPage, playlists, allFriendEntries, friendship, watchlistData, ownerAuth, pendingRequests] = await Promise.all([
        getPrivacySettings(profile.user_id),
        getUserReviews(profile.user_id),
        getUserPlaylists(profile.user_id),
        getFriendsWithProfiles(profile.user_id),
        isOwnProfile ? Promise.resolve(null) : getFriendshipStatus(profile.user_id),
        supabase.from('watchlist').select(WATCHLIST_COLUMNS).eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(1000),
        adminClient.auth.admin.getUserById(profile.user_id),
        isOwnProfile ? getPendingRequestsWithProfiles() : Promise.resolve([]),
    ])

    const watchlist = (watchlistData.data ?? []) as WatchlistEntry[]
    const isFriend = friendship?.status === 'accepted'

    function canView(visibility: string): boolean {
        if (isOwnProfile) return true
        if (visibility === 'public') return true
        if (visibility === 'friends' && isFriend) return true
        return false
    }

    const toWatch = canView(privacy.watchlist_visibility) ? watchlist.filter(e => e.status === 'to_watch') : []
    const watched = canView(privacy.watched_visibility) ? watchlist.filter(e => e.status === 'watched') : []

    const filteredReviews = canView(privacy.reviews_visibility) ? reviewsPage.reviews : []
    const initialReviewsCursor = canView(privacy.reviews_visibility) ? reviewsPage.nextCursor : null
    const filteredFriends = canView(privacy.friends_visibility) ? allFriendEntries : []

    const ownerMeta = ownerAuth.data.user?.user_metadata
    const avatarUrl = typeof ownerMeta?.avatar_url === 'string' ? ownerMeta.avatar_url : undefined
    const fullName = typeof ownerMeta?.full_name === 'string' ? ownerMeta.full_name : undefined

    return (
        <PageLayout>
            <ProfileHero
                profile={profile}
                avatarUrl={avatarUrl}
                fullName={fullName}
                isOwnProfile={isOwnProfile}
                friendshipButton={!isOwnProfile ? (
                    <FriendshipButton
                        key={friendship ? `${friendship.id}-${friendship.status}` : 'none'}
                        targetUserId={profile.user_id}
                        currentUserId={currentUser.id}
                        friendship={friendship}
                    />
                ) : undefined}
                optionsMenu={!isOwnProfile ? (
                    <ProfileOptionsMenu
                        key={friendship ? `${friendship.id}-${friendship.status}` : 'none'}
                        targetUserId={profile.user_id}
                        friendship={friendship}
                    />
                ) : undefined}
            />
            <ProfileTabs
                toWatch={toWatch}
                watched={watched}
                reviews={filteredReviews}
                initialReviewsCursor={initialReviewsCursor}
                profileUserId={profile.user_id}
                playlists={playlists}
                friends={filteredFriends}
                pendingRequests={pendingRequests}
                privacy={privacy}
                isOwnProfile={isOwnProfile}
                isFriend={isFriend}
            />
        </PageLayout>
    )
}
