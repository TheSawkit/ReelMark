'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { FriendEntry, PrivacyVisibility } from '@/types/profile';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { PrivacyBlock } from '@/components/profile/PrivacyBlock';
import { EmptyState } from '@/components/ui/EmptyState';

interface FriendsSectionProps {
	friends: FriendEntry[];
	visibility: PrivacyVisibility;
	canView: boolean;
}

export function FriendsSection({
	friends,
	visibility,
	canView,
}: FriendsSectionProps) {
	const { t, lang } = useTranslation();

	if (!canView) return <PrivacyBlock visibility={visibility} />;
	if (friends.length === 0)
		return <EmptyState message={t.profile.noFriends} />;

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
			{friends.map(({ friendship, username, avatarUrl, fullName }) => {
				const displayName = fullName || username;
				const initials = displayName.slice(0, 2).toUpperCase();

				return (
					<Link
						key={friendship.id}
						href={localizedHref(lang, `/profile/${username}`)}
						className="flex flex-col items-center gap-2 p-3 rounded-lg bg-surface border border-border-subtle shadow-card-sm hover:bg-surface-2 transition-colors"
					>
						{avatarUrl ? (
							<Image
								src={avatarUrl}
								alt={displayName}
								width={48}
								height={48}
								className="rounded-full object-cover border border-border"
								unoptimized
							/>
						) : (
							<div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center">
								<span className="text-sm font-bold text-muted">
									{initials}
								</span>
							</div>
						)}
						<div className="text-center min-w-0 w-full">
							<p className="text-sm font-medium text-text truncate">
								{displayName}
							</p>
							<p className="text-xs text-muted truncate">
								@{username}
							</p>
						</div>
					</Link>
				);
			})}
		</div>
	);
}
