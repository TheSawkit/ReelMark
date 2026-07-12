import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getServerLanguage } from '@/lib/i18n/server';
import { PageLayout } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlaylistHero } from '@/components/profile/PlaylistHero';
import { PlaylistItemsView } from '@/components/profile/PlaylistItemsView';
import { getPlaylistById } from '@/app/actions/playlists';
import { getUserReviewRatings } from '@/app/actions/reviews';
import { playlistItemToMediaItem } from '@/lib/mappers';
import { getGenres } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/tmdb/images';
import { localizedAlternates } from '@/lib/metadata';

interface Props {
	params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const [t, lang] = await Promise.all([
		getTranslations(),
		getServerLanguage(),
	]);
	const result = await getPlaylistById(id);

	if (!result) {
		return { robots: { index: false, follow: false } };
	}

	const { playlist, ownerUsername } = result;
	const owner = ownerUsername ?? t.profile.unknownUser;
	const description = t.metadata.playlistDescription.replace(
		'${owner}',
		owner
	);
	const posterPath = playlist.items?.[0]?.poster_path;
	const ogImage = posterPath ? getImageUrl(posterPath, 'w342') : undefined;
	const isPublic = playlist.visibility === 'public';

	return {
		title: playlist.name,
		description,
		robots: isPublic
			? { index: true, follow: true }
			: { index: false, follow: false },
		alternates: localizedAlternates(lang, `/playlist/${id}`),
		openGraph: {
			title: playlist.name,
			description,
			type: 'website',
			images: ogImage ? [{ url: ogImage }] : undefined,
		},
		twitter: {
			card: ogImage ? 'summary_large_image' : 'summary',
			title: playlist.name,
			description,
			images: ogImage ? [ogImage] : undefined,
		},
	};
}

export default async function PlaylistPage({ params }: Props) {
	const { id } = await params;
	const t = await getTranslations();
	const result = await getPlaylistById(id);

	if (!result) notFound();

	const { playlist, isOwn, ownerUsername, ownerAvatarUrl } = result;
	const items = (playlist.items ?? []).map(playlistItemToMediaItem);

	const [genreNames, ratingByKey] = await Promise.all([
		getGenres(),
		isOwn
			? getUserReviewRatings(playlist.user_id)
			: Promise.resolve<Record<string, number>>({}),
	]);

	return (
		<>
			<PlaylistHero
				playlist={playlist}
				ownerUsername={ownerUsername}
				ownerAvatarUrl={ownerAvatarUrl}
			/>
			<PageLayout className="pt-8 md:pt-12">
				{items.length > 0 ? (
					<PlaylistItemsView
						items={items}
						genreNames={genreNames}
						ratingByKey={ratingByKey}
						storageKey={`reelmark:list:playlist:${id}`}
					/>
				) : (
					<EmptyState message={t.profile.noPlaylistsYet} />
				)}
			</PageLayout>
		</>
	);
}
