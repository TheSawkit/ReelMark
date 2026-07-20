import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';
import { PageLayout } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlaylistHero } from '@/components/profile/PlaylistHero';
import { PlaylistItemsView } from '@/components/profile/PlaylistItemsView';
import { PlaylistPageSkeleton } from '@/components/profile/PlaylistPageSkeleton';
import { getPlaylistById } from '@/app/actions/playlists';
import { getPublicPlaylistMeta } from '@/lib/playlists/public-metadata';
import { getUserReviewRatings } from '@/app/actions/reviews';
import { playlistItemToMediaItem } from '@/lib/mappers';
import { getGenres } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/tmdb/images';
import { localizedAlternates } from '@/lib/metadata';

interface Props {
	params: Promise<{ lang: Language; id: string }>;
}


/**
 * One sample value so Cache Components can validate this route at build time.
 * Real playlists are rendered on demand (`dynamicParams` stays on).
 */
export async function generateStaticParams() {
	return [{ id: '00000000-0000-0000-0000-000000000000' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang, id } = await params;
	const [t, meta] = await Promise.all([
		getTranslations(lang),
		getPublicPlaylistMeta(id),
	]);

	if (!meta) {
		return { robots: { index: false, follow: false } };
	}

	const owner = meta.ownerUsername ?? t.profile.unknownUser;
	const description = t.metadata.playlistDescription.replace(
		'${owner}',
		owner
	);
	const ogImage = meta.posterPath
		? getImageUrl(meta.posterPath, 'w342')
		: undefined;

	return {
		title: meta.name,
		description,
		robots: { index: true, follow: true },
		alternates: localizedAlternates(lang, `/playlist/${id}`),
		openGraph: {
			title: meta.name,
			description,
			type: 'website',
			images: ogImage ? [{ url: ogImage }] : undefined,
		},
		twitter: {
			card: ogImage ? 'summary_large_image' : 'summary',
			title: meta.name,
			description,
			images: ogImage ? [ogImage] : undefined,
		},
	};
}

export default function PlaylistPage({ params }: Props) {
	return (
		<Suspense fallback={<PlaylistPageSkeleton />}>
			<PlaylistContent params={params} />
		</Suspense>
	);
}

async function PlaylistContent({ params }: Props) {
	const { lang, id } = await params;
	const t = await getTranslations(lang);
	const result = await getPlaylistById(id);

	if (!result) notFound();

	const { playlist, isOwn, ownerUsername, ownerAvatarUrl } = result;
	const items = (playlist.items ?? []).map(playlistItemToMediaItem);

	const [genreNames, ratingByKey] = await Promise.all([
		getGenres(lang),
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
