import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
	getCrewDetails,
	getCrewMovieCredits,
	getCrewTvCredits,
} from '@/lib/tmdb';
import { CrewBanner } from '@/components/crew/CrewBanner';
import { CrewBio } from '@/components/crew/CrewBio';
import { CrewFilmography } from '@/components/crew/CrewFilmography';
import {
	movieCreditToMediaItem,
	tvCreditToMediaItem,
	movieCrewCreditToMediaItem,
	tvCrewCreditToMediaItem,
} from '@/lib/mappers';
import { buildFilmographyDepartments } from '@/lib/filmography';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { mergeWithWatchlist } from '@/lib/data/watchlist';
import { getTranslations } from '@/lib/i18n/server';
import { BASE_URL } from '@/lib/metadata';

type CrewPageParams = Promise<{ id: string }>;
interface CrewPageProps {
	params: CrewPageParams;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const crewId = parseInt(id);
	const t = await getTranslations();

	if (isNaN(crewId)) {
		return {
			title: 'ReelMark',
			description: t.metadata.defaultCrewDescription,
		};
	}

	try {
		const crew = await getCrewDetails(crewId);
		const profileImage = crew.profile_path
			? `https://image.tmdb.org/t/p/w500${crew.profile_path}`
			: undefined;

		const images = profileImage
			? [{ url: profileImage, width: 500, height: 750 }]
			: [];
		const bioDescription =
			crew.biography?.substring(0, 160) ||
			t.metadata.exploreCrewOn.replace('${name}', crew.name);

		return {
			title: crew.name,
			description: bioDescription,
			alternates: { canonical: `${BASE_URL}/crew/${crewId}` },
			openGraph: {
				title: crew.name,
				description: bioDescription,
				type: 'profile',
				images: images.length > 0 ? images : undefined,
			},
			twitter: {
				card: 'summary_large_image',
				title: crew.name,
				description: bioDescription,
				images: images.length > 0 ? [images[0].url] : undefined,
			},
		};
	} catch {
		return {
			title: 'ReelMark',
			description: t.metadata.defaultCrewDescription,
		};
	}
}

async function CrewFilmographySection({
	crewId,
	knownForDepartment,
}: {
	crewId: number;
	knownForDepartment: string;
}) {
	const [movieCredits, tvCredits] = await Promise.all([
		getCrewMovieCredits(crewId),
		getCrewTvCredits(crewId),
	]);

	const actingItems = [
		...movieCredits.cast.map(movieCreditToMediaItem),
		...tvCredits.cast.map(tvCreditToMediaItem),
	];
	const crewItems = [
		...movieCredits.crew.map((credit) => ({
			department: credit.department,
			item: movieCrewCreditToMediaItem(credit),
		})),
		...tvCredits.crew.map((credit) => ({
			department: credit.department,
			item: tvCrewCreditToMediaItem(credit),
		})),
	];

	const departments = buildFilmographyDepartments(
		actingItems,
		crewItems,
		knownForDepartment
	);
	const merged = await Promise.all(
		departments.map(async (department) => ({
			key: department.key,
			items: await mergeWithWatchlist(department.items),
		}))
	);

	return <CrewFilmography departments={merged} />;
}

function FilmographySkeleton() {
	return (
		<div className="space-y-6">
			<div className="h-8 w-40 rounded bg-surface-2 animate-pulse" />
			<PosterGridSkeleton />
		</div>
	);
}

export default async function CrewPage(props: CrewPageProps) {
	const params = await props.params;
	const crewId = parseInt(params.id);

	if (isNaN(crewId)) {
		notFound();
	}

	let crew;
	try {
		crew = await getCrewDetails(crewId);
	} catch {
		notFound();
	}

	return (
		<div className="min-h-screen">
			<CrewBanner crew={crew} />

			<div className="container mx-auto px-6 lg:px-12 py-8 space-y-12">
				<CrewBio biography={crew.biography} />

				<Suspense fallback={<FilmographySkeleton />}>
					<CrewFilmographySection
						crewId={crewId}
						knownForDepartment={crew.known_for_department}
					/>
				</Suspense>
			</div>
		</div>
	);
}
