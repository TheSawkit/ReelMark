import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { resolveAvatarUrl } from '@/lib/avatar';
import { getTranslations } from '@/lib/i18n/server';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfileTabsSkeleton } from '@/components/profile/ProfileTabsSkeleton';
import { FriendshipButton } from '@/components/profile/FriendshipButton';
import { ProfileOptionsMenu } from '@/components/profile/ProfileOptionsMenu';
import {
	getProfileByUsername,
	getPrivacySettings,
} from '@/app/actions/profile';
import { getUserReviews, getUserReviewRatings } from '@/app/actions/reviews';
import { getUserPlaylists } from '@/app/actions/playlists';
import {
	getFriendsWithProfiles,
	getFriendshipStatus,
	getPendingRequestsWithProfiles,
} from '@/app/actions/friends';
import { getGenres } from '@/lib/tmdb';
import { ListMetadataBackfill } from '@/components/library/ListMetadataBackfill';
import type { WatchlistEntry } from '@/types/tmdb';
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns';

export const dynamic = 'force-dynamic';

interface Props {
	params: Promise<{ username: string }>;
}

type Friendship = Awaited<ReturnType<typeof getFriendshipStatus>>;

export async function generateMetadata({
	params,
}: Props): Promise<import('next').Metadata> {
	const { username } = await params;
	const t = await getTranslations();
	const description = t.metadata.profileDescription.replace(
		'${username}',
		username
	);
	return {
		title: `@${username}`,
		description,
		robots: {
			index: false,
			follow: false,
			googleBot: { index: false, follow: false },
		},
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
	};
}

async function ProfileTabsSection({
	profileUserId,
	isOwnProfile,
	friendship,
}: {
	profileUserId: string;
	isOwnProfile: boolean;
	friendship: Friendship;
}) {
	const supabase = await createClient();
	const isFriend = friendship?.status === 'accepted';

	const [
		privacy,
		reviewsPage,
		playlists,
		allFriendEntries,
		watchlistData,
		pendingRequests,
		genreNames,
		ratingByKey,
	] = await Promise.all([
		getPrivacySettings(profileUserId),
		getUserReviews(profileUserId),
		getUserPlaylists(profileUserId),
		getFriendsWithProfiles(profileUserId),
		supabase
			.from('watchlist')
			.select(WATCHLIST_COLUMNS)
			.eq('user_id', profileUserId)
			.order('created_at', { ascending: false })
			.limit(1000),
		isOwnProfile ? getPendingRequestsWithProfiles() : Promise.resolve([]),
		getGenres(),
		isOwnProfile
			? getUserReviewRatings(profileUserId)
			: Promise.resolve<Record<string, number>>({}),
	]);

	const watchlist = (watchlistData.data ?? []) as WatchlistEntry[];

	function canView(visibility: string): boolean {
		if (isOwnProfile) return true;
		if (visibility === 'public') return true;
		if (visibility === 'friends' && isFriend) return true;
		return false;
	}

	const toWatch = canView(privacy.watchlist_visibility)
		? watchlist.filter((e) => e.status === 'to_watch')
		: [];
	const watched = canView(privacy.watched_visibility)
		? watchlist.filter((e) => e.status === 'watched')
		: [];

	const filteredReviews = canView(privacy.reviews_visibility)
		? reviewsPage.reviews
		: [];
	const initialReviewsCursor = canView(privacy.reviews_visibility)
		? reviewsPage.nextCursor
		: null;
	const filteredFriends = canView(privacy.friends_visibility)
		? allFriendEntries
		: [];

	return (
		<>
			{isOwnProfile && <ListMetadataBackfill />}
			<ProfileTabs
				toWatch={toWatch}
				watched={watched}
				reviews={filteredReviews}
				initialReviewsCursor={initialReviewsCursor}
				profileUserId={profileUserId}
				playlists={playlists}
				friends={filteredFriends}
				pendingRequests={pendingRequests}
				privacy={privacy}
				isOwnProfile={isOwnProfile}
				isFriend={isFriend}
				genreNames={genreNames}
				ratingByKey={ratingByKey}
			/>
		</>
	);
}

export default async function ProfilePage({ params }: Props) {
	const { username } = await params;

	const [currentUser, profile] = await Promise.all([
		requireAuth(),
		getProfileByUsername(username),
	]);
	if (!profile) notFound();

	const isOwnProfile = currentUser.id === profile.user_id;
	const adminClient = createAdminClient();

	const [friendship, ownerAuth] = await Promise.all([
		isOwnProfile
			? Promise.resolve(null)
			: getFriendshipStatus(profile.user_id),
		adminClient.auth.admin.getUserById(profile.user_id),
	]);

	const ownerMeta = ownerAuth.data.user?.user_metadata;
	const avatarUrl =
		resolveAvatarUrl(profile.avatar_url, ownerMeta?.avatar_url) ??
		undefined;
	const fullName =
		typeof ownerMeta?.full_name === 'string'
			? ownerMeta.full_name
			: undefined;

	return (
		<PageLayout className="screen-in">
			<ProfileHero
				profile={profile}
				avatarUrl={avatarUrl}
				fullName={fullName}
				isOwnProfile={isOwnProfile}
				friendshipButton={
					!isOwnProfile ? (
						<FriendshipButton
							key={
								friendship
									? `${friendship.id}-${friendship.status}`
									: 'none'
							}
							targetUserId={profile.user_id}
							currentUserId={currentUser.id}
							friendship={friendship}
						/>
					) : undefined
				}
				optionsMenu={
					!isOwnProfile ? (
						<ProfileOptionsMenu
							key={
								friendship
									? `${friendship.id}-${friendship.status}`
									: 'none'
							}
							targetUserId={profile.user_id}
							friendship={friendship}
						/>
					) : undefined
				}
			/>
			<Suspense fallback={<ProfileTabsSkeleton />}>
				<ProfileTabsSection
					profileUserId={profile.user_id}
					isOwnProfile={isOwnProfile}
					friendship={friendship}
				/>
			</Suspense>
		</PageLayout>
	);
}
