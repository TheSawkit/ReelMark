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
import { WatchButton } from '@/components/media/detail/WatchButton';
import { MediaDetailLayout } from '@/components/media/detail/MediaDetailLayout';
import { SeasonCard } from '@/components/media/tv/SeasonCard';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PublicReviewsSection } from '@/components/media/reviews/PublicReviewsSection';
import { getMediaWatchlistEntry } from '@/app/actions/watchlist';
import { getTvShowWatchProgress } from '@/app/actions/episodes';
import { getShowAverageRating, getMediaReview } from '@/app/actions/reviews';
import { CommunityRatingBadge } from '@/components/media/detail/CommunityRatingBadge';
import { filterTrailers, buildMediaDetailMetadata } from '@/lib/media-detail';
import { filterAvailableVideos } from '@/lib/youtube';
import { getServerLocale, getTranslations } from '@/lib/i18n/server';
import type { Season } from '@/types/tmdb';

type TvPageParams = Promise<{ id: string }>;
interface TvPageProps {
	params: TvPageParams;
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

	let tvDetails, credits, videos, images;
	try {
		[tvDetails, credits, videos, images] = await Promise.all([
			getTvShowDetails(tvId),
			getTvShowCredits(tvId),
			getTvShowVideos(tvId),
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
			if (
				!(
					probeError instanceof Error &&
					probeError.message.includes('404')
				)
			)
				throw probeError;
		}
		if (isMovie) redirect(`/movie/${tvId}`);
		notFound();
	}

	const [
		trailers,
		watchProviders,
		watchlistEntry,
		watchProgress,
		showRating,
		userReview,
		t,
		locale,
	] = await Promise.all([
		filterAvailableVideos(filterTrailers(videos)),
		getTvShowWatchProviders(tvId).catch(() => null),
		getMediaWatchlistEntry(tvId, 'tv'),
		getTvShowWatchProgress(tvId),
		getShowAverageRating(tvId),
		getMediaReview(tvId, 'tv'),
		getTranslations(),
		getServerLocale(),
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
	const totalWatched = Array.from(watchProgress.values()).reduce(
		(sum, count) => sum + count,
		0
	);
	const overallPercent =
		totalEpisodes > 0
			? Math.round((totalWatched / totalEpisodes) * 100)
			: 0;

	const isWatched = watchlistEntry?.status === 'watched';

	const banner = (
		<MediaBanner
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
				<CommunityRatingBadge
					rating={showRating}
					isWatched={isWatched}
					mediaId={tvDetails.id}
					mediaType="tv"
					mediaTitle={tvDetails.name}
					posterPath={tvDetails.poster_path}
					initialReview={userReview}
				/>
			}
			actions={
				<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					<div className="w-full sm:w-auto">
						<WatchButton
							mediaId={tvDetails.id}
							mediaTitle={tvDetails.name}
							mediaType="tv"
							posterPath={tvDetails.poster_path}
							status={
								watchlistEntry?.status === 'watched'
									? 'watched'
									: 'to_watch'
							}
							variant="full"
							initialIsActive={!!watchlistEntry}
							releaseDate={tvDetails.first_air_date}
						/>
					</div>
					{totalWatched > 0 && (
						<div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-md glass-overlay">
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-muted">
									{totalWatched}/{totalEpisodes}{' '}
									{t.movie.episodes}
								</span>
								<ProgressBar
									watched={totalWatched}
									total={totalEpisodes}
									className="w-24 sm:w-32 h-1.5 bg-surface-3 rounded-full"
									innerClassName="bg-linear-to-r from-primary to-gold rounded-full"
								/>
							</div>
							<span className="text-sm font-bold text-text">
								{overallPercent}%
							</span>
						</div>
					)}
				</div>
			}
		/>
	);

	const actionsBar = (
		<WatchButton
			mediaId={tvDetails.id}
			mediaTitle={tvDetails.name}
			mediaType="tv"
			posterPath={tvDetails.poster_path}
			status={
				watchlistEntry?.status === 'watched' ? 'watched' : 'to_watch'
			}
			variant="responsive"
			initialIsActive={!!watchlistEntry}
			releaseDate={tvDetails.first_air_date}
		/>
	);

	const seasonsSection =
		standardSeasons.length > 0 ? (
			<section className="space-y-6">
				<SectionHeading>{t.movie.seasons}</SectionHeading>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{standardSeasons.map((season: Season) => (
						<SeasonCard
							key={season.id}
							tvId={tvId}
							season={season}
							seasonWatched={
								watchProgress.get(season.season_number) ?? 0
							}
							locale={locale}
							labels={{
								episodes: t.movie.episodes,
								completed: `✓ ${t.movie.completed}`,
								watchedProgress: (w, total) =>
									`${w}/${total} ${t.movie.watchedCount}`,
							}}
						/>
					))}
				</div>
			</section>
		) : null;

	return (
		<MediaDetailLayout
			banner={banner}
			actionsBar={actionsBar}
			description={tvDetails.overview}
			watchProviders={watchProviders}
			rating={showRating}
			reviews={
				<Suspense
					fallback={
						<div className="h-32 rounded-xl bg-surface/20 animate-pulse" />
					}
				>
					<PublicReviewsSection mediaId={tvId} mediaType="tv" />
				</Suspense>
			}
			extraSections={seasonsSection}
			trailers={trailers}
			cast={credits.cast}
		/>
	);
}
