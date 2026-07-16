import { Skeleton } from '@/components/ui/skeleton';
import { notFound, redirect } from 'next/navigation';
import { fetchTMDB } from '@/lib/tmdb/client';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
	getImageUrl,
	getMovieDetails,
	getMovieCredits,
	getMovieVideos,
	getMovieImages,
	selectHeroImage,
	getMovieWatchProviders,
} from '@/lib/tmdb';
import { MediaBanner } from '@/components/media/detail/MediaBanner';
import { MovieWatchActions } from '@/components/media/detail/MovieWatchActions';
import { MediaDetailLayout } from '@/components/media/detail/MediaDetailLayout';
import { WatchProviders } from '@/components/media/detail/WatchProviders';
import { MediaTrailers } from '@/components/media/detail/MediaTrailers';
import {
	DetailSectionSkeleton,
	WatchActionsSkeleton,
} from '@/components/media/detail/MediaDetailSkeleton';
import { PublicReviewsSection } from '@/components/media/reviews/PublicReviewsSection';
import { getMediaWatchlistEntry } from '@/app/actions/watchlist';
import { getAverageRating, getMediaReview } from '@/app/actions/reviews';
import { CommunityRatingBadge } from '@/components/media/detail/CommunityRatingBadge';
import { MediaCommunityRating } from '@/components/media/detail/MediaCommunityRating';
import { filterTrailers, buildMediaDetailMetadata } from '@/lib/media-detail';
import { movieJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { groupCrew } from '@/lib/crew';
import { filterAvailableVideos } from '@/lib/youtube';
import { localizedHref } from '@/lib/i18n/utils';
import type { MovieDetails } from '@/types/tmdb';
import type { Language } from '@/lib/i18n/translations';

type MoviePageParams = Promise<{ lang: Language; id: string }>;
interface MoviePageProps {
	params: MoviePageParams;
}

export const dynamic = 'force-dynamic';

type MovieUserData = Awaited<ReturnType<typeof loadMovieUserData>>;

function loadMovieUserData(movieId: number) {
	return Promise.all([
		getMediaWatchlistEntry(movieId, 'movie'),
		getAverageRating(movieId, 'movie'),
		getMediaReview(movieId, 'movie'),
	]);
}

async function MovieProvidersSection({ movieId }: { movieId: number }) {
	const providers = await getMovieWatchProviders(movieId).catch(() => null);
	return <WatchProviders providers={providers} />;
}

async function MovieTrailersSection({ movieId }: { movieId: number }) {
	const videos = await getMovieVideos(movieId);
	const trailers = await filterAvailableVideos(filterTrailers(videos));
	if (trailers.length === 0) return null;
	return <MediaTrailers trailers={trailers} />;
}

async function MovieUserActions({
	userData,
	movie,
	variant,
}: {
	userData: Promise<MovieUserData>;
	movie: MovieDetails;
	variant: 'banner' | 'bar';
}) {
	const [watchlistEntry] = await userData;
	return (
		<MovieWatchActions
			mediaId={movie.id}
			mediaTitle={movie.title}
			posterPath={movie.poster_path}
			releaseDate={movie.release_date}
			initialStatus={watchlistEntry?.status ?? 'none'}
			watchedAt={watchlistEntry?.created_at ?? null}
			variant={variant}
		/>
	);
}

async function MovieCommunityBadge({
	userData,
	movie,
}: {
	userData: Promise<MovieUserData>;
	movie: MovieDetails;
}) {
	const [watchlistEntry, rating, userReview] = await userData;
	return (
		<CommunityRatingBadge
			rating={rating}
			isWatched={watchlistEntry?.status === 'watched'}
			mediaId={movie.id}
			mediaType="movie"
			mediaTitle={movie.title}
			posterPath={movie.poster_path}
			initialReview={userReview}
		/>
	);
}

async function MovieRatingSection({
	userData,
	movieId,
}: {
	userData: Promise<MovieUserData>;
	movieId: number;
}) {
	const [, rating] = await userData;
	return (
		<MediaCommunityRating
			mediaId={movieId}
			mediaType="movie"
			initialRating={rating}
		/>
	);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const movieId = parseInt(id);
	if (isNaN(movieId)) return { title: 'ReelMark' };
	return buildMediaDetailMetadata('movie', movieId);
}

export default async function MoviePage(props: MoviePageProps) {
	const params = await props.params;
	const { lang } = params;
	const movieId = parseInt(params.id);

	if (isNaN(movieId)) notFound();

	const userData = loadMovieUserData(movieId);
	userData.catch(() => {});

	let movieDetails, credits, images;
	try {
		[movieDetails, credits, images] = await Promise.all([
			getMovieDetails(movieId),
			getMovieCredits(movieId),
			getMovieImages(movieId),
		]);
	} catch (error) {
		if (!(error instanceof Error && error.message.includes('404')))
			throw error;

		let isTvShow = false;
		try {
			await fetchTMDB(`/tv/${movieId}`, {}, 86400);
			isTvShow = true;
		} catch (probeError) {
			if (!(
				probeError instanceof Error &&
				probeError.message.includes('404')
			))
				throw probeError;
		}
		if (isTvShow) redirect(localizedHref(lang, `/tv/${movieId}`));
		notFound();
	}

	const heroImageUrl = getImageUrl(
		selectHeroImage(images, movieDetails.backdrop_path),
		'original'
	);

	const crew = groupCrew(credits.crew);

	const banner = (
		<MediaBanner
			mediaType="movie"
			mediaId={movieDetails.id}
			title={movieDetails.title}
			tagline={movieDetails.tagline}
			backdropUrl={heroImageUrl}
			posterPath={movieDetails.poster_path}
			voteAverage={movieDetails.vote_average}
			releaseDate={movieDetails.release_date}
			runtime={movieDetails.runtime}
			certification={movieDetails.certification}
			genres={movieDetails.genres}
			communityBadge={
				<Suspense fallback={null}>
					<MovieCommunityBadge
						userData={userData}
						movie={movieDetails}
					/>
				</Suspense>
			}
			actions={
				<Suspense fallback={<WatchActionsSkeleton variant="banner" />}>
					<MovieUserActions
						userData={userData}
						movie={movieDetails}
						variant="banner"
					/>
				</Suspense>
			}
		/>
	);

	const actionsBar = (
		<Suspense fallback={<WatchActionsSkeleton variant="bar" />}>
			<MovieUserActions
				userData={userData}
				movie={movieDetails}
				variant="bar"
			/>
		</Suspense>
	);

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: serializeJsonLd(
						movieJsonLd(movieDetails, credits, lang)
					),
				}}
			/>
			<MediaDetailLayout
				banner={banner}
				actionsBar={actionsBar}
				description={movieDetails.overview}
				crew={crew}
				watchProviders={
					<Suspense fallback={<DetailSectionSkeleton />}>
						<MovieProvidersSection movieId={movieId} />
					</Suspense>
				}
				rating={
					<Suspense fallback={null}>
						<MovieRatingSection
							userData={userData}
							movieId={movieId}
						/>
					</Suspense>
				}
				reviews={
					<Suspense
						fallback={<Skeleton className="h-32 rounded-xl" />}
					>
						<PublicReviewsSection
							mediaId={movieId}
							mediaType="movie"
						/>
					</Suspense>
				}
				trailers={
					<Suspense fallback={<DetailSectionSkeleton />}>
						<MovieTrailersSection movieId={movieId} />
					</Suspense>
				}
				cast={credits.cast}
			/>
		</>
	);
}
