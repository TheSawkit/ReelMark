import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
	getActorDetails,
	getActorMovieCredits,
	getActorTvCredits,
} from '@/lib/tmdb';
import { ActorBanner } from '@/components/actor/ActorBanner';
import { ActorBio } from '@/components/actor/ActorBio';
import { ActorFilmography } from '@/components/actor/ActorFilmography';
import { movieCreditToMediaItem, tvCreditToMediaItem } from '@/lib/mappers';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { mergeWithWatchlist } from '@/lib/data/watchlist';
import { getTranslations } from '@/lib/i18n/server';
import { BASE_URL } from '@/lib/metadata';

type ActorPageParams = Promise<{ id: string }>;
interface ActorPageProps {
	params: ActorPageParams;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const actorId = parseInt(id);
	const t = await getTranslations();

	if (isNaN(actorId)) {
		return {
			title: 'ReelMark',
			description: t.metadata.defaultActorDescription,
		};
	}

	try {
		const actor = await getActorDetails(actorId);
		const profileImage = actor.profile_path
			? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
			: undefined;

		const images = profileImage
			? [{ url: profileImage, width: 500, height: 750 }]
			: [];
		const bioDescription =
			actor.biography?.substring(0, 160) ||
			t.metadata.exploreActorOn.replace('${name}', actor.name);

		return {
			title: actor.name,
			description: bioDescription,
			alternates: { canonical: `${BASE_URL}/actor/${actorId}` },
			openGraph: {
				title: actor.name,
				description: bioDescription,
				type: 'profile',
				images: images.length > 0 ? images : undefined,
			},
			twitter: {
				card: 'summary_large_image',
				title: actor.name,
				description: bioDescription,
				images: images.length > 0 ? [images[0].url] : undefined,
			},
		};
	} catch {
		return {
			title: 'ReelMark',
			description: t.metadata.defaultActorDescription,
		};
	}
}

async function ActorFilmographySection({ actorId }: { actorId: number }) {
	const [movieCredits, tvCredits] = await Promise.all([
		getActorMovieCredits(actorId),
		getActorTvCredits(actorId),
	]);
	const [mergedMovies, mergedTvShows] = await Promise.all([
		mergeWithWatchlist(movieCredits.map(movieCreditToMediaItem)),
		mergeWithWatchlist(tvCredits.map(tvCreditToMediaItem)),
	]);

	return <ActorFilmography movies={mergedMovies} tvShows={mergedTvShows} />;
}

function FilmographySkeleton() {
	return (
		<div className="space-y-6">
			<div className="h-8 w-40 rounded bg-surface-2 animate-pulse" />
			<PosterGridSkeleton />
		</div>
	);
}

export default async function ActorPage(props: ActorPageProps) {
	const params = await props.params;
	const actorId = parseInt(params.id);

	if (isNaN(actorId)) {
		notFound();
	}

	let actor;
	try {
		actor = await getActorDetails(actorId);
	} catch {
		notFound();
	}

	return (
		<div className="min-h-screen">
			<ActorBanner actor={actor} />

			<div className="container mx-auto px-6 lg:px-12 py-8 space-y-12">
				<ActorBio biography={actor.biography} />

				<Suspense fallback={<FilmographySkeleton />}>
					<ActorFilmographySection actorId={actorId} />
				</Suspense>
			</div>
		</div>
	);
}
