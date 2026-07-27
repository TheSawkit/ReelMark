import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { getAllTvShowsWatchProgress } from '@/lib/data/episodes';
import { getCachedUserWatchlist } from '@/lib/data/watchlist';
import { getMyReviewRatings } from '@/lib/data/reviews';
import {
	LibraryView,
	LibraryLiveSubtitle,
} from '@/components/library/LibraryView';
import { ListMetadataBackfill } from '@/components/library/ListMetadataBackfill';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import type { Language } from '@/lib/i18n/translations';
import { getTranslations, type Translations } from '@/lib/i18n/server';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { getTvShowsTotalEpisodes, getGenres } from '@/lib/tmdb';
import { BASE_URL, buildPageMetadata } from '@/lib/metadata';
import type { MediaType } from '@/types/tmdb';

export async function generateMetadata({ params }: Props) {
	const { lang } = await params;
	const t = await getTranslations(lang);
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
	params: Promise<{ lang: Language }>;
};

async function LibrarySubtitle({ t }: { t: Translations }) {
	const fullWatchlist = await getCachedUserWatchlist();
	const subtitle = (type: MediaType) => {
		const count = fullWatchlist.filter(
			(entry) => entry.media_type === type
		).length;
		const isPlural = count > 1;
		const countText = isPlural
			? type === 'tv'
				? t.library.tvCountPlural
				: t.library.filmsCountPlural
			: type === 'tv'
				? t.library.tvCount
				: t.library.filmsCount;
		return `${count} ${countText} ${t.library.inLibrary}`;
	};

	return (
		<LibraryLiveSubtitle movie={subtitle('movie')} tv={subtitle('tv')} />
	);
}

async function LibraryContent({ lang }: { lang: Language }) {
	const [fullWatchlist, genreNames, ratingByKey] = await Promise.all([
		getCachedUserWatchlist(),
		getGenres(lang),
		getMyReviewRatings(),
	]);
	const dataset = (type: MediaType) => {
		const entries = fullWatchlist.filter(
			(entry) => entry.media_type === type
		);
		return {
			toWatch: entries.filter((entry) => entry.status === 'to_watch'),
			watched: entries.filter((entry) => entry.status === 'watched'),
			abandoned: entries.filter((entry) => entry.status === 'abandoned'),
		};
	};

	const tvEntries = fullWatchlist.filter(
		(entry) => entry.media_type === 'tv'
	);
	const tvIds = tvEntries.map((entry) => entry.media_id);
	const stored: Record<number, number> = {};
	const missing: number[] = [];
	for (const entry of tvEntries) {
		if (typeof entry.total_episodes === 'number') {
			stored[entry.media_id] = entry.total_episodes;
		} else {
			missing.push(entry.media_id);
		}
	}
	const [watchedCounts, fetched] = await Promise.all([
		getAllTvShowsWatchProgress(tvIds),
		missing.length > 0
			? getTvShowsTotalEpisodes(missing, lang)
			: Promise.resolve<Record<number, number>>({}),
	]);
	const tvProgressMap: Record<number, { watched: number; total: number }> =
		{};
	for (const tvId of tvIds) {
		tvProgressMap[tvId] = {
			watched: watchedCounts[tvId] ?? 0,
			total: stored[tvId] ?? fetched[tvId] ?? 0,
		};
	}

	return (
		<>
			<ListMetadataBackfill />
			<LibraryView
				movie={dataset('movie')}
				tv={dataset('tv')}
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

export default async function LibraryPage({ params: paramsPromise }: Props) {
	const { lang } = await paramsPromise;
	const t = await getTranslations(lang);

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
						<LibrarySubtitle t={t} />
					</Suspense>
				}
			/>

			<Suspense fallback={<div className="h-11.5 mb-8" />}>
				<MediaTypeSwitcher defaultType="movie" shallow />
			</Suspense>

			<Suspense fallback={<LibraryGridSkeleton />}>
				<LibraryContent lang={lang} />
			</Suspense>
		</PageLayout>
	);
}
