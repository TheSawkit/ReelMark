import { Skeleton } from '@/components/ui/skeleton';
import { notFound, redirect } from 'next/navigation';
import { fetchTMDB } from '@/lib/tmdb/client';
import { Suspense, cache } from 'react';
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
import { CertificationBadge } from '@/components/media/detail/CertificationBadge';
import { TvWatchActions } from '@/components/media/detail/TvWatchActions';
import { MediaDetailLayout } from '@/components/media/detail/MediaDetailLayout';
import { SimilarSection } from '@/components/media/detail/SimilarSection';
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
import { getServerLocale, getTranslations } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import type { Season, TvShowDetails } from '@/types/tmdb';
import type { Language } from '@/lib/i18n/translations';

type TvPageParams = Promise<{ lang: Language; id: string }>;
interface TvPageProps {
	params: TvPageParams;
}

/**
 * Every Supabase read of the page, shared as one promise. Deferred through `cache()` so the
 * session is only touched when a Suspense-wrapped section awaits it — starting it eagerly in
 * the page body would block the static shell.
 */
const loadTvUserData = cache((tvId: number) =>
	Promise.all([
		getMediaWatchlistEntry(tvId, 'tv'),
		getTvShowWatchProgress(tvId),
		getShowAverageRating(tvId),
		getMediaReview(tvId, 'tv'),
	])
);

const SEASON_GRID_CLASS =
	'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

async function TvProvidersSection({
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

async function TvTrailersSection({
	tvId,
	lang,
}: {
	tvId: number;
	lang: Language;
}) {
	const videos = await getTvShowVideos(tvId, lang);
	const trailers = await filterAvailableVideos(filterTrailers(videos));
	if (trailers.length === 0) return null;
	return <MediaTrailers trailers={trailers} />;
}

async function TvUserActions({
	show,
	variant,
}: {
	show: TvShowDetails;
	variant: 'banner' | 'bar';
}) {
	const [watchlistEntry] = await loadTvUserData(show.id);
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

async function TvCommunityBadge({ show }: { show: TvShowDetails }) {
	const [watchlistEntry, , rating, userReview] = await loadTvUserData(show.id);
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

async function TvRatingSection({ tvId }: { tvId: number }) {
	const [, , rating] = await loadTvUserData(tvId);
	return (
		<MediaCommunityRating
			mediaId={tvId}
			mediaType="tv"
			initialRating={rating}
		/>
	);
}

async function TvProgressSummary({
	tvId,
	totalEpisodes,
	seasons,
}: {
	tvId: number;
	totalEpisodes: number;
	seasons: Season[];
}) {
	const [, watchProgress] = await loadTvUserData(tvId);
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
	tvId,
	seasons,
	locale,
}: {
	tvId: number;
	seasons: Season[];
	locale: string;
}) {
	const [, watchProgress] = await loadTvUserData(tvId);
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

/**
 * One sample id so Cache Components can validate this route at build time.
 * Every other title is rendered on demand (`dynamicParams` stays on).
 */
export async function generateStaticParams() {
	return [{ id: '1399' }];
}

export async function generateMetadata({
	params,
}: {
	params: TvPageParams;
}): Promise<Metadata> {
	const { id, lang } = await params;
	const tvId = parseInt(id);
	if (isNaN(tvId)) return { title: 'ReelMark' };
	return buildMediaDetailMetadata('tv', tvId, lang);
}

export default async function TvShowPage(props: TvPageProps) {
	const params = await props.params;
	const { lang } = params;
	const tvId = parseInt(params.id);

	if (isNaN(tvId)) notFound();

	let tvDetails, credits, images;
	try {
		[tvDetails, credits, images] = await Promise.all([
			getTvShowDetails(tvId, lang),
			getTvShowCredits(tvId, lang),
			getTvShowImages(tvId, lang),
		]);
	} catch (error) {
		if (!(error instanceof Error && error.message.includes('404')))
			throw error;

		let isMovie = false;
		try {
			await fetchTMDB(`/movie/${tvId}`, {}, { revalidate: 86400 });
			isMovie = true;
		} catch (probeError) {
			if (!(
				probeError instanceof Error &&
				probeError.message.includes('404')
			))
				throw probeError;
		}
		if (isMovie) redirect(localizedHref(lang, `/movie/${tvId}`));
		notFound();
	}

	const [t, locale] = await Promise.all([
		getTranslations(lang),
		getServerLocale(lang),
	]);

	const heroImageUrl = getImageUrl(
		selectHeroImage(images, tvDetails.backdrop_path),
		'w1280'
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
			title={tvDetails.name}
			tagline={tvDetails.tagline}
			backdropUrl={heroImageUrl}
			posterPath={tvDetails.poster_path}
			voteAverage={tvDetails.vote_average}
			releaseDate={tvDetails.first_air_date}
			runtime={tvDetails.episode_run_time?.[0]}
			certification={
				<Suspense fallback={null}>
					<CertificationBadge
						mediaId={tvId}
						mediaType="tv"
						lang={lang}
					/>
				</Suspense>
			}
			genres={tvDetails.genres}
			communityBadge={
				<Suspense fallback={null}>
					<TvCommunityBadge show={tvDetails} />
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
								show={tvDetails}
								variant="banner"
							/>
						</Suspense>
					</div>
					<Suspense fallback={null}>
						<TvProgressSummary
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
			<TvUserActions show={tvDetails} variant="bar" />
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
						<TvProvidersSection tvId={tvId} lang={lang} />
					</Suspense>
				}
				rating={
					<Suspense fallback={null}>
						<TvRatingSection tvId={tvId} />
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
				relatedSections={
					<Suspense fallback={null}>
						<SimilarSection
							mediaId={tvId}
							mediaType="tv"
							lang={lang}
						/>
					</Suspense>
				}
				trailers={
					<Suspense fallback={<DetailSectionSkeleton />}>
						<TvTrailersSection tvId={tvId} lang={lang} />
					</Suspense>
				}
				cast={credits.cast}
			/>
		</>
	);
}
