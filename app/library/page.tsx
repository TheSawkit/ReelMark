import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getAllTvShowsWatchProgress } from '@/app/actions/episodes';
import { getCachedUserWatchlist } from '@/lib/data/watchlist';
import { LibraryTabs } from '@/components/library/LibraryTabs';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations } from '@/lib/i18n/server';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { getTvShowTotalEpisodes } from '@/lib/tmdb';
import { BASE_URL, buildPageMetadata } from '@/lib/metadata';

type Translations = Awaited<ReturnType<typeof getTranslations>>;
type MediaKind = 'movie' | 'tv';

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
	type: MediaKind;
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

async function LibraryContent({ type }: { type: MediaKind }) {
	const fullWatchlist = await getCachedUserWatchlist();
	const watchlist = fullWatchlist.filter((entry) => entry.media_type === type);

	const toWatch = watchlist.filter((entry) => entry.status === 'to_watch');
	const watched = watchlist.filter((entry) => entry.status === 'watched');

	const tvProgressMap: Record<number, { watched: number; total: number }> =
		{};
	if (type === 'tv') {
		const tvIds = watchlist.map((entry) => entry.media_id);
		const [watchedCounts, totals] = await Promise.all([
			getAllTvShowsWatchProgress(tvIds),
			Promise.all(
				tvIds.map((tvId) =>
					getTvShowTotalEpisodes(tvId).then((total) => ({
						tvId,
						total,
					}))
				)
			),
		]);
		for (const { tvId, total } of totals) {
			tvProgressMap[tvId] = { watched: watchedCounts[tvId] ?? 0, total };
		}
	}

	return (
		<LibraryTabs
			toWatch={toWatch}
			watched={watched}
			tvProgress={tvProgressMap}
		/>
	);
}

function LibraryGridSkeleton() {
	return (
		<>
			<div className="flex gap-2 border-b border-border pb-0 mb-8">
				<div className="h-10 w-24 rounded-t-lg bg-surface-2 animate-pulse" />
				<div className="h-10 w-20 rounded-t-lg bg-surface-2 animate-pulse" />
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="aspect-2/3 rounded-(--radius-cinema) bg-surface-2 animate-pulse"
					/>
				))}
			</div>
		</>
	);
}

export default async function LibraryPage({ searchParams }: Props) {
	await requireAuth();

	const params = await searchParams;
	const type: MediaKind = params?.type === 'tv' ? 'tv' : 'movie';

	const t = await getTranslations();

	return (
		<PageLayout className="screen-in">
			<PageHeader
				title={t.pages.library.title}
				subtitle={
					<Suspense
						fallback={
							<span className="inline-block h-5 w-40 max-w-full animate-pulse rounded bg-surface-2 align-middle" />
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
