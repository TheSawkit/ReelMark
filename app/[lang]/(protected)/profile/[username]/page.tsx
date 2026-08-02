import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { resolveAvatarUrl } from '@/lib/avatar';
import type { Language } from '@/lib/i18n/translations';
import { getTranslations } from '@/lib/i18n/server';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfileTabsSkeleton } from '@/components/profile/ProfileTabsSkeleton';
import { ProfileHeroSkeleton } from '@/components/profile/ProfileHeroSkeleton';
import { FriendshipButton } from '@/components/profile/FriendshipButton';
import { ProfileOptionsMenu } from '@/components/profile/ProfileOptionsMenu';
import { getProfileByUsername, getPrivacySettings } from '@/lib/data/profile';
import { getUserReviews, getUserReviewRatings } from '@/lib/data/reviews';
import { getUserPlaylists } from '@/lib/data/playlists';
import {
	getFriendsWithProfiles,
	getFriendshipStatus,
	getPendingRequestsWithProfiles,
} from '@/lib/data/friends';
import { getGenres } from '@/lib/tmdb';
import { ListMetadataBackfill } from '@/components/library/ListMetadataBackfill';
import type { WatchlistEntry } from '@/types/tmdb';
import { WATCHLIST_COLUMNS } from '@/lib/supabase/columns';
import { fetchAllRows } from '@/lib/supabase/pagination';

interface Props {
	params: Promise<{ lang: Language; username: string }>;
}

type Friendship = Awaited<ReturnType<typeof getFriendshipStatus>>;

/**
 * One sample value so Cache Components can validate this route at build time.
 * Real profiles are rendered on demand (`dynamicParams` stays on).
 */
export async function generateStaticParams() {
	return [{ username: 'reelmark-sample-profile' }];
}

export async function generateMetadata({
	params,
}: Props): Promise<import('next').Metadata> {
	const { lang, username } = await params;
	const t = await getTranslations(lang);
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
	lang,
}: {
	profileUserId: string;
	isOwnProfile: boolean;
	friendship: Friendship;
	lang: Language;
}) {
	const supabase = await createClient();
	const isFriend = friendship?.status === 'accepted';

	const [
		privacy,
		reviewsPage,
		reviewsCountData,
		playlists,
		allFriendEntries,
		watchlistData,
		pendingRequests,
		genreNames,
		ratingByKey,
	] = await Promise.all([
		getPrivacySettings(profileUserId),
		getUserReviews(profileUserId),
		supabase
			.from('reviews')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', profileUserId),
		getUserPlaylists(profileUserId),
		getFriendsWithProfiles(profileUserId),
		fetchAllRows((from, to) =>
			supabase
				.from('watchlist')
				.select(WATCHLIST_COLUMNS)
				.eq('user_id', profileUserId)
				.order('created_at', { ascending: false })
				.order('id')
				.range(from, to)
		),
		isOwnProfile ? getPendingRequestsWithProfiles() : Promise.resolve([]),
		getGenres(lang),
		isOwnProfile
			? getUserReviewRatings(profileUserId)
			: Promise.resolve<Record<string, number>>({}),
	]);

	const watchlist = watchlistData as WatchlistEntry[];

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
	const reviewsCount = canView(privacy.reviews_visibility)
		? (reviewsCountData.count ?? 0)
		: 0;
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
				reviewsCount={reviewsCount}
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

export default function ProfilePage({ params }: Props) {
	return (
		<Suspense
			fallback={
				<PageLayout>
					<ProfileHeroSkeleton />
					<ProfileTabsSkeleton />
				</PageLayout>
			}
		>
			<ProfileContent params={params} />
		</Suspense>
	);
}

async function ProfileContent({ params }: Props) {
	const { lang, username } = await params;

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
		<PageLayout>
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
					lang={lang}
				/>
			</Suspense>
		</PageLayout>
	);
}
