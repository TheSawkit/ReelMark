import { Skeleton } from '@/components/ui/skeleton';
import { notFound, redirect } from 'next/navigation';
import { fetchTMDB } from '@/lib/tmdb/client';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
	getImageUrl,
	getTvShowDetails,
	getTvShowCredits,
	getTvShowVideos,
	getTvShowImages,
	selectHeroImage,
	getTvShowWatchProviders,
} from '@/lib/tmdb';
import { MediaBanner } from '@/components/media/detail/MediaBanner';
import { TvWatchActions } from '@/components/media/detail/TvWatchActions';
import { MediaDetailLayout } from '@/components/media/detail/MediaDetailLayout';
import { WatchProviders } from '@/components/media/detail/WatchProviders';
import { MediaTrailers } from '@/components/media/detail/MediaTrailers';
import {
	DetailSectionSkeleton,
	WatchActionsSkeleton,
} from '@/components/media/detail/MediaDetailSkeleton';
import { SeasonCard } from '@/components/media/tv/SeasonCard';
import { SeasonCardSkeleton } from '@/components/media/tv/SeasonCardSkeleton';
import { TvWatchSummary } from '@/components/media/tv/TvWatchSummary';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PublicReviewsSection } from '@/components/media/reviews/PublicReviewsSection';
import { getMediaWatchlistEntry } from '@/app/actions/watchlist';
import { getTvShowWatchProgress } from '@/app/actions/episodes';
import { getShowAverageRating, getMediaReview } from '@/app/actions/reviews';
import { CommunityRatingBadge } from '@/components/media/detail/CommunityRatingBadge';
import { MediaCommunityRating } from '@/components/media/detail/MediaCommunityRating';
import { filterTrailers, buildMediaDetailMetadata } from '@/lib/media-detail';
import { tvSeriesJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { groupCrew } from '@/lib/crew';
import { filterAvailableVideos } from '@/lib/youtube';
import {
	getServerLocale,
	getTranslations,
	getServerLanguage,
} from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import type { Season, TvShowDetails } from '@/types/tmdb';

export const dynamic = 'force-dynamic';

type TvPageParams = Promise<{ id: string }>;
interface TvPageProps {
	params: TvPageParams;
}

type TvUserData = Awaited<ReturnType<typeof loadTvUserData>>;

function loadTvUserData(tvId: number) {
	return Promise.all([
		getMediaWatchlistEntry(tvId, 'tv'),
		getTvShowWatchProgress(tvId),
		getShowAverageRating(tvId),
		getMediaReview(tvId, 'tv'),
	]);
}

const SEASON_GRID_CLASS =
	'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

async function TvProvidersSection({ tvId }: { tvId: number }) {
	const providers = await getTvShowWatchProviders(tvId).catch(() => null);
	return <WatchProviders providers={providers} />;
}

async function TvTrailersSection({ tvId }: { tvId: number }) {
	const videos = await getTvShowVideos(tvId);
	const trailers = await filterAvailableVideos(filterTrailers(videos));
	if (trailers.length === 0) return null;
	return <MediaTrailers trailers={trailers} />;
}

async function TvUserActions({
	userData,
	show,
	variant,
}: {
	userData: Promise<TvUserData>;
	show: TvShowDetails;
	variant: 'banner' | 'bar';
}) {
	const [watchlistEntry] = await userData;
	return (
		<TvWatchActions
			mediaId={show.id}
			mediaTitle={show.name}
			posterPath={show.poster_path}
			releaseDate={show.first_air_date}
			initialStatus={watchlistEntry?.status ?? 'none'}
			variant={variant}
		/>
	);
}

async function TvCommunityBadge({
	userData,
	show,
}: {
	userData: Promise<TvUserData>;
	show: TvShowDetails;
}) {
	const [watchlistEntry, , rating, userReview] = await userData;
	return (
		<CommunityRatingBadge
			rating={rating}
			isWatched={watchlistEntry?.status === 'watched'}
			mediaId={show.id}
			mediaType="tv"
			mediaTitle={show.name}
			posterPath={show.poster_path}
			initialReview={userReview}
		/>
	);
}

async function TvRatingSection({
	userData,
	tvId,
}: {
	userData: Promise<TvUserData>;
	tvId: number;
}) {
	const [, , rating] = await userData;
	return (
		<MediaCommunityRating
			mediaId={tvId}
			mediaType="tv"
			initialRating={rating}
		/>
	);
}

async function TvProgressSummary({
	userData,
	tvId,
	totalEpisodes,
	seasons,
}: {
	userData: Promise<TvUserData>;
	tvId: number;
	totalEpisodes: number;
	seasons: Season[];
}) {
	const [, watchProgress] = await userData;
	return (
		<TvWatchSummary
			tvId={tvId}
			totalEpisodes={totalEpisodes}
			seasons={seasons.map((season) => ({
				seasonNumber: season.season_number,
				watched: watchProgress.get(season.season_number) ?? 0,
			}))}
		/>
	);
}

async function TvSeasonsGrid({
	userData,
	tvId,
	seasons,
	locale,
}: {
	userData: Promise<TvUserData>;
	tvId: number;
	seasons: Season[];
	locale: string;
}) {
	const [, watchProgress] = await userData;
	return (
		<div className={SEASON_GRID_CLASS}>
			{seasons.map((season) => (
				<SeasonCard
					key={season.id}
					tvId={tvId}
					season={season}
					seasonWatched={watchProgress.get(season.season_number) ?? 0}
					locale={locale}
				/>
			))}
		</div>
	);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const tvId = parseInt(id);
	if (isNaN(tvId)) return { title: 'ReelMark' };
	return buildMediaDetailMetadata('tv', tvId);
}

export default async function TvShowPage(props: TvPageProps) {
	const params = await props.params;
	const tvId = parseInt(params.id);

	if (isNaN(tvId)) notFound();

	const userData = loadTvUserData(tvId);
	userData.catch(() => {});

	let tvDetails, credits, images;
	try {
		[tvDetails, credits, images] = await Promise.all([
			getTvShowDetails(tvId),
			getTvShowCredits(tvId),
			getTvShowImages(tvId),
		]);
	} catch (error) {
		if (!(error instanceof Error && error.message.includes('404')))
			throw error;

		let isMovie = false;
		try {
			await fetchTMDB(`/movie/${tvId}`, {}, 86400);
			isMovie = true;
		} catch (probeError) {
			if (!(
				probeError instanceof Error &&
				probeError.message.includes('404')
			))
				throw probeError;
		}
		if (isMovie)
			redirect(
				localizedHref(await getServerLanguage(), `/movie/${tvId}`)
			);
		notFound();
	}

	const [t, locale, lang] = await Promise.all([
		getTranslations(),
		getServerLocale(),
		getServerLanguage(),
	]);

	const heroImageUrl = getImageUrl(
		selectHeroImage(images, tvDetails.backdrop_path),
		'original'
	);
	const standardSeasons = (tvDetails.seasons ?? []).filter(
		(s: { season_number: number }) => s.season_number > 0
	);
	const totalEpisodes = standardSeasons.reduce(
		(sum: number, s: { episode_count: number }) => sum + s.episode_count,
		0
	);

	const crew = groupCrew(credits.crew);

	const banner = (
		<MediaBanner
			mediaType="tv"
			mediaId={tvDetails.id}
			title={tvDetails.name}
			tagline={tvDetails.tagline}
			backdropUrl={heroImageUrl}
			posterPath={tvDetails.poster_path}
			voteAverage={tvDetails.vote_average}
			releaseDate={tvDetails.first_air_date}
			runtime={tvDetails.episode_run_time?.[0]}
			certification={tvDetails.certification}
			genres={tvDetails.genres}
			communityBadge={
				<Suspense fallback={null}>
					<TvCommunityBadge userData={userData} show={tvDetails} />
				</Suspense>
			}
			actions={
				<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					<div className="w-full sm:w-auto">
						<Suspense
							fallback={
								<Skeleton className="h-11 w-full sm:w-40 rounded-lg" />
							}
						>
							<TvUserActions
								userData={userData}
								show={tvDetails}
								variant="banner"
							/>
						</Suspense>
					</div>
					<Suspense fallback={null}>
						<TvProgressSummary
							userData={userData}
							tvId={tvId}
							totalEpisodes={totalEpisodes}
							seasons={standardSeasons}
						/>
					</Suspense>
				</div>
			}
		/>
	);

	const actionsBar = (
		<Suspense fallback={<WatchActionsSkeleton variant="bar" />}>
			<TvUserActions userData={userData} show={tvDetails} variant="bar" />
		</Suspense>
	);

	const seasonsSection =
		standardSeasons.length > 0 ? (
			<section className="space-y-6">
				<SectionHeading>{t.movie.seasons}</SectionHeading>
				<Suspense
					fallback={
						<div className={SEASON_GRID_CLASS}>
							{standardSeasons.map((season: Season) => (
								<SeasonCardSkeleton key={season.id} />
							))}
						</div>
					}
				>
					<TvSeasonsGrid
						userData={userData}
						tvId={tvId}
						seasons={standardSeasons}
						locale={locale}
					/>
				</Suspense>
			</section>
		) : null;

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: serializeJsonLd(
						tvSeriesJsonLd(tvDetails, credits, lang)
					),
				}}
			/>
			<MediaDetailLayout
				banner={banner}
				actionsBar={actionsBar}
				description={tvDetails.overview}
				crew={crew}
				creators={tvDetails.created_by}
				watchProviders={
					<Suspense fallback={<DetailSectionSkeleton />}>
						<TvProvidersSection tvId={tvId} />
					</Suspense>
				}
				rating={
					<Suspense fallback={null}>
						<TvRatingSection userData={userData} tvId={tvId} />
					</Suspense>
				}
				reviews={
					<Suspense
						fallback={<Skeleton className="h-32 rounded-xl" />}
					>
						<PublicReviewsSection mediaId={tvId} mediaType="tv" />
					</Suspense>
				}
				extraSections={seasonsSection}
				trailers={
					<Suspense fallback={<DetailSectionSkeleton />}>
						<TvTrailersSection tvId={tvId} />
					</Suspense>
				}
				cast={credits.cast}
			/>
		</>
	);
}
