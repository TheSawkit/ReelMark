import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
	getTvShowDetails,
	getSeasonDetails,
	getTvShowWatchProviders,
	getImageUrl,
} from '@/lib/tmdb';
import { getServerLocale, getTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';
import { getSeasonEpisodeWatches } from '@/app/actions/episodes';
import {
	getSeasonAverageRating,
	getPublicEpisodeReviews,
	getMyEpisodeReviews,
} from '@/app/actions/reviews';
import { SeasonBanner } from '@/components/media/tv/SeasonBanner';
import { SeasonWatchButton } from '@/components/media/tv/SeasonWatchButton';
import { MediaActionsBar } from '@/components/media/detail/MediaActionsBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CommunityRating } from '@/components/media/detail/CommunityRating';
import { WatchProviders } from '@/components/media/detail/WatchProviders';
import { DetailSectionSkeleton } from '@/components/media/detail/MediaDetailSkeleton';
import { SeasonEpisodesList } from '@/components/media/tv/SeasonEpisodesList';
import { localizedAlternates } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

type SeasonPageParams = Promise<{
	lang: Language;
	id: string;
	seasonNumber: string;
}>;
interface SeasonPageProps {
	params: SeasonPageParams;
}

async function SeasonProvidersSection({
	tvId,
	lang,
}: {
	tvId: number;
	lang: Language;
}) {
	const providers = await getTvShowWatchProviders(tvId, lang).catch(
		() => null
	);
	return <WatchProviders providers={providers} />;
}

export async function generateMetadata({
	params: paramsPromise,
}: SeasonPageProps): Promise<Metadata> {
	const params = await paramsPromise;
	const tvId = parseInt(params.id);
	const seasonNumber = parseInt(params.seasonNumber);

	if (isNaN(tvId) || isNaN(seasonNumber)) return { title: 'Season' };

	const { lang } = params;

	try {
		const [tvDetails, seasonDetails] = await Promise.all([
			getTvShowDetails(tvId, lang),
			getSeasonDetails(tvId, seasonNumber, lang),
		]);
		const description =
			seasonDetails.overview ||
			`${seasonDetails.name} of ${tvDetails.name}`;
		const posterPath = seasonDetails.poster_path ?? tvDetails.poster_path;
		const ogImage = posterPath
			? getImageUrl(posterPath, 'w500')
			: undefined;

		return {
			title: `${seasonDetails.name} — ${tvDetails.name}`,
			description,
			alternates: localizedAlternates(
				lang,
				`/tv/${tvId}/season/${seasonNumber}`
			),
			openGraph: {
				title: `${seasonDetails.name} — ${tvDetails.name}`,
				description,
				type: 'video.tv_show',
				images: ogImage ? [{ url: ogImage }] : undefined,
			},
			twitter: {
				card: 'summary_large_image',
				title: `${seasonDetails.name} — ${tvDetails.name}`,
				description,
				images: ogImage ? [ogImage] : undefined,
			},
		};
	} catch {
		return { title: 'Season' };
	}
}

export default async function SeasonPage(props: SeasonPageProps) {
	const params = await props.params;
	const { lang } = params;
	const tvId = parseInt(params.id);
	const seasonNumber = parseInt(params.seasonNumber);

	if (isNaN(tvId) || isNaN(seasonNumber)) notFound();

	let tvDetails, seasonDetails;
	try {
		[tvDetails, seasonDetails] = await Promise.all([
			getTvShowDetails(tvId, lang),
			getSeasonDetails(tvId, seasonNumber, lang),
		]);
	} catch {
		notFound();
	}

	const episodeIds = seasonDetails.episodes.map((e) => e.id);
	const [
		t,
		locale,
		watchedEpisodes,
		seasonRating,
		episodeReviews,
		myEpisodeReviews,
	] = await Promise.all([
		getTranslations(lang),
		getServerLocale(lang),
		getSeasonEpisodeWatches(tvId, seasonNumber),
		getSeasonAverageRating(tvId, seasonNumber),
		getPublicEpisodeReviews(episodeIds),
		getMyEpisodeReviews(episodeIds),
	]);

	const watchedCount = watchedEpisodes.size;

	const reviewsByEpisodeId = new Map<number, typeof episodeReviews>();
	for (const review of episodeReviews) {
		const list = reviewsByEpisodeId.get(review.media_id) ?? [];
		list.push(review);
		reviewsByEpisodeId.set(review.media_id, list);
	}

	const totalEpisodes = seasonDetails.episodes.length;
	const backdropUrl = getImageUrl(
		tvDetails.backdrop_path ??
			seasonDetails.poster_path ??
			tvDetails.poster_path,
		'original'
	);

	return (
		<div className="min-h-screen">
			<SeasonBanner
				tvId={tvId}
				tvName={tvDetails.name}
				seasonName={seasonDetails.name}
				seasonNumber={seasonNumber}
				backdropUrl={backdropUrl}
				posterPath={seasonDetails.poster_path ?? tvDetails.poster_path}
				airDate={seasonDetails.air_date}
				episodeCount={totalEpisodes}
				watchedCount={watchedCount}
				totalEpisodes={totalEpisodes}
				genres={tvDetails.genres}
				rating={seasonRating}
			/>

			<MediaActionsBar>
				<SeasonWatchButton
					tvId={tvId}
					seasonNumber={seasonNumber}
					totalEpisodes={totalEpisodes}
					watchedCount={watchedCount}
				/>
			</MediaActionsBar>

			<div className="detail-container">
				{seasonDetails.overview && (
					<div className="max-w-4xl space-y-4">
						<SectionHeading>{t.explorer.overview}</SectionHeading>
						<p className="text-lg text-muted leading-relaxed font-light">
							{seasonDetails.overview}
						</p>
					</div>
				)}

				<Suspense fallback={<DetailSectionSkeleton />}>
					<SeasonProvidersSection tvId={tvId} lang={lang} />
				</Suspense>

				{seasonRating && (
					<CommunityRating
						avg={seasonRating.avg}
						count={seasonRating.count}
					/>
				)}

				<div className="w-full h-px bg-border/10 my-8" />

				<section className="space-y-6">
					<SectionHeading>
						{t.movie.episodesCapitalized}
						<span className="text-muted text-base font-normal ml-1">
							({seasonDetails.episodes.length})
						</span>
					</SectionHeading>
					<SeasonEpisodesList
						tvId={tvId}
						seasonNumber={seasonNumber}
						episodes={seasonDetails.episodes}
						watchedEpisodeNumbers={Array.from(watchedEpisodes)}
						reviewsByEpisodeId={Object.fromEntries(
							reviewsByEpisodeId
						)}
						myReviewsByEpisodeId={myEpisodeReviews}
						locale={locale}
						labels={{
							noImage: t.movie.noImage,
							noDescription: t.movie.noDescription,
						}}
					/>
				</section>
			</div>
		</div>
	);
}
