import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getUserWatchlist } from '@/app/actions/watchlist';
import { getAllTvShowsWatchProgress } from '@/app/actions/episodes';
import { LibraryTabs } from '@/components/library/LibraryTabs';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
import { getTranslations } from '@/lib/i18n/server';
import { MediaTypeSwitcher } from '@/components/media/card/MediaTypeSwitcher';
import { getTvShowTotalEpisodes } from '@/lib/tmdb';
import { BASE_URL, buildPageMetadata } from '@/lib/metadata';

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

export default async function LibraryPage({ searchParams }: Props) {
	await requireAuth();

	const params = await searchParams;
	const type = params?.type === 'tv' ? 'tv' : 'movie';

	const t = await getTranslations();
	const fullWatchlist = await getUserWatchlist();
	const watchlist = fullWatchlist.filter(
		(entry) => entry.media_type === type
	);

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

	const isPlural = watchlist.length > 1;
	const filmsCountText = isPlural
		? type === 'tv'
			? t.library.tvCountPlural
			: t.library.filmsCountPlural
		: type === 'tv'
			? t.library.tvCount
			: t.library.filmsCount;
	const inLibraryText = t.library.inLibrary;

	return (
		<PageLayout>
			<PageHeader
				title={t.pages.library.title}
				subtitle={`${watchlist.length} ${filmsCountText} ${inLibraryText}`}
			/>

			<Suspense fallback={<div className="h-11.5 mb-8" />}>
				<MediaTypeSwitcher defaultType="movie" />
			</Suspense>

			<LibraryTabs
				toWatch={toWatch}
				watched={watched}
				tvProgress={tvProgressMap}
			/>
		</PageLayout>
	);
}
