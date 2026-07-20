import { Skeleton } from '@/components/ui/skeleton';
import { notFound, redirect } from 'next/navigation';
import { fetchTMDB } from '@/lib/tmdb/client';
import { Suspense, cache } from 'react';
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
import { CertificationBadge } from '@/components/media/detail/CertificationBadge';
import { MovieWatchActions } from '@/components/media/detail/MovieWatchActions';
import { MediaDetailLayout } from '@/components/media/detail/MediaDetailLayout';
import { SagaSection } from '@/components/media/detail/SagaSection';
import { SimilarSection } from '@/components/media/detail/SimilarSection';
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

/**
 * Every Supabase read of the page, shared as one promise. Deferred through `cache()` so the
 * session is only touched when a Suspense-wrapped section awaits it — starting it eagerly in
 * the page body would block the static shell.
 */
const loadMovieUserData = cache((movieId: number) =>
	Promise.all([
		getMediaWatchlistEntry(movieId, 'movie'),
		getAverageRating(movieId, 'movie'),
		getMediaReview(movieId, 'movie'),
	])
);

async function MovieProvidersSection({
	movieId,
	lang,
}: {
	movieId: number;
	lang: Language;
}) {
	const providers = await getMovieWatchProviders(movieId, lang).catch(
		() => null
	);
	return <WatchProviders providers={providers} />;
}

async function MovieTrailersSection({
	movieId,
	lang,
}: {
	movieId: number;
	lang: Language;
}) {
	const videos = await getMovieVideos(movieId, lang);
	const trailers = await filterAvailableVideos(filterTrailers(videos));
	if (trailers.length === 0) return null;
	return <MediaTrailers trailers={trailers} />;
}

async function MovieUserActions({
	movie,
	variant,
}: {
	movie: MovieDetails;
	variant: 'banner' | 'bar';
}) {
	const [watchlistEntry] = await loadMovieUserData(movie.id);
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

async function MovieCommunityBadge({ movie }: { movie: MovieDetails }) {
	const [watchlistEntry, rating, userReview] = await loadMovieUserData(
		movie.id
	);
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

async function MovieRatingSection({ movieId }: { movieId: number }) {
	const [, rating] = await loadMovieUserData(movieId);
	return (
		<MediaCommunityRating
			mediaId={movieId}
			mediaType="movie"
			initialRating={rating}
		/>
	);
}

/**
 * One sample id so Cache Components can validate this route at build time.
 * Every other title is rendered on demand (`dynamicParams` stays on).
 */
export async function generateStaticParams() {
	return [{ id: '550' }];
}

export async function generateMetadata({
	params,
}: {
	params: MoviePageParams;
}): Promise<Metadata> {
	const { id, lang } = await params;
	const movieId = parseInt(id);
	if (isNaN(movieId)) return { title: 'ReelMark' };
	return buildMediaDetailMetadata('movie', movieId, lang);
}

export default async function MoviePage(props: MoviePageProps) {
	const params = await props.params;
	const { lang } = params;
	const movieId = parseInt(params.id);

	if (isNaN(movieId)) notFound();

	let movieDetails, credits, images;
	try {
		[movieDetails, credits, images] = await Promise.all([
			getMovieDetails(movieId, lang),
			getMovieCredits(movieId, lang),
			getMovieImages(movieId, lang),
		]);
	} catch (error) {
		if (!(error instanceof Error && error.message.includes('404')))
			throw error;

		let isTvShow = false;
		try {
			await fetchTMDB(`/tv/${movieId}`, {}, { revalidate: 86400 });
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
		'w1280'
	);

	const crew = groupCrew(credits.crew);

	const banner = (
		<MediaBanner
			title={movieDetails.title}
			tagline={movieDetails.tagline}
			backdropUrl={heroImageUrl}
			posterPath={movieDetails.poster_path}
			voteAverage={movieDetails.vote_average}
			releaseDate={movieDetails.release_date}
			runtime={movieDetails.runtime}
			certification={
				<Suspense fallback={null}>
					<CertificationBadge
						mediaId={movieId}
						mediaType="movie"
						lang={lang}
					/>
				</Suspense>
			}
			genres={movieDetails.genres}
			communityBadge={
				<Suspense fallback={null}>
					<MovieCommunityBadge movie={movieDetails} />
				</Suspense>
			}
			actions={
				<Suspense fallback={<WatchActionsSkeleton variant="banner" />}>
					<MovieUserActions movie={movieDetails} variant="banner" />
				</Suspense>
			}
		/>
	);

	const actionsBar = (
		<Suspense fallback={<WatchActionsSkeleton variant="bar" />}>
			<MovieUserActions movie={movieDetails} variant="bar" />
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
						<MovieProvidersSection movieId={movieId} lang={lang} />
					</Suspense>
				}
				rating={
					<Suspense fallback={null}>
						<MovieRatingSection movieId={movieId} />
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
						<MovieTrailersSection movieId={movieId} lang={lang} />
					</Suspense>
				}
				relatedSections={
					<>
						<Suspense fallback={null}>
							<SagaSection
								collection={movieDetails.belongs_to_collection}
								currentMovieId={movieId}
								lang={lang}
							/>
						</Suspense>
						<Suspense fallback={null}>
							<SimilarSection
								mediaId={movieId}
								mediaType="movie"
								lang={lang}
							/>
						</Suspense>
					</>
				}
				cast={credits.cast}
			/>
		</>
	);
}
