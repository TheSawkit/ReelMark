import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { getAllTvShowsWatchProgress } from '@/app/actions/episodes';
import { getCachedUserWatchlist } from '@/lib/data/watchlist';
import { getMyReviewRatings } from '@/app/actions/reviews';
import { LibraryTabs } from '@/components/library/LibraryTabs';
import { ListMetadataBackfill } from '@/components/library/ListMetadataBackfill';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations, type Translations } from '@/lib/i18n/server';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { getTvShowsTotalEpisodes, getGenres } from '@/lib/tmdb';
import { BASE_URL, buildPageMetadata } from '@/lib/metadata';
import type { MediaType } from '@/types/tmdb';

export async function generateMetadata() {
	const t = await getTranslations();
	return buildPageMetadata(
		t.pages.library.title,
		t.metadata.libraryDescription,
		{
			isPrivate: true,
			canonical: `${BASE_URL}/library`,
		}
	);
}

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function LibrarySubtitle({
	type,
	t,
}: {
	type: MediaType;
	t: Translations;
}) {
	const fullWatchlist = await getCachedUserWatchlist();
	const count = fullWatchlist.filter(
		(entry) => entry.media_type === type
	).length;
	const isPlural = count > 1;
	const filmsCountText = isPlural
		? type === 'tv'
			? t.library.tvCountPlural
			: t.library.filmsCountPlural
		: type === 'tv'
			? t.library.tvCount
			: t.library.filmsCount;

	return <>{`${count} ${filmsCountText} ${t.library.inLibrary}`}</>;
}

async function LibraryContent({ type }: { type: MediaType }) {
	const [fullWatchlist, genreNames, ratingByKey] = await Promise.all([
		getCachedUserWatchlist(),
		getGenres(),
		getMyReviewRatings(),
	]);
	const watchlist = fullWatchlist.filter(
		(entry) => entry.media_type === type
	);

	const toWatch = watchlist.filter((entry) => entry.status === 'to_watch');
	const watched = watchlist.filter((entry) => entry.status === 'watched');

	const tvProgressMap: Record<number, { watched: number; total: number }> =
		{};
	if (type === 'tv') {
		const tvIds = watchlist.map((entry) => entry.media_id);
		const stored: Record<number, number> = {};
		const missing: number[] = [];
		for (const entry of watchlist) {
			if (typeof entry.total_episodes === 'number') {
				stored[entry.media_id] = entry.total_episodes;
			} else {
				missing.push(entry.media_id);
			}
		}
		const [watchedCounts, fetched] = await Promise.all([
			getAllTvShowsWatchProgress(tvIds),
			missing.length > 0
				? getTvShowsTotalEpisodes(missing)
				: Promise.resolve<Record<number, number>>({}),
		]);
		for (const tvId of tvIds) {
			tvProgressMap[tvId] = {
				watched: watchedCounts[tvId] ?? 0,
				total: stored[tvId] ?? fetched[tvId] ?? 0,
			};
		}
	}

	return (
		<>
			<ListMetadataBackfill />
			<LibraryTabs
				toWatch={toWatch}
				watched={watched}
				tvProgress={tvProgressMap}
				genreNames={genreNames}
				ratingByKey={ratingByKey}
			/>
		</>
	);
}

function LibraryGridSkeleton() {
	return (
		<>
			<div className="flex gap-2 border-b border-border pb-0 mb-8">
				<Skeleton className="h-10 w-24 rounded-t-lg" />
				<Skeleton className="h-10 w-20 rounded-t-lg" />
			</div>
			<PosterGridSkeleton count={6} />
		</>
	);
}

export default async function LibraryPage({ searchParams }: Props) {
	const params = await searchParams;
	const type: MediaType = params?.type === 'tv' ? 'tv' : 'movie';

	const t = await getTranslations();

	return (
		<PageLayout className="screen-in">
			<PageHeader
				title={t.pages.library.title}
				subtitle={
					<Suspense
						fallback={
							<span className="inline-block h-5 w-40 max-w-full rounded bg-surface-2 align-middle animate-shimmer skeleton-sheen" />
						}
					>
						<LibrarySubtitle type={type} t={t} />
					</Suspense>
				}
			/>

			<Suspense fallback={<div className="h-11.5 mb-8" />}>
				<MediaTypeSwitcher defaultType="movie" />
			</Suspense>

			<Suspense fallback={<LibraryGridSkeleton />}>
				<LibraryContent type={type} />
			</Suspense>
		</PageLayout>
	);
}
