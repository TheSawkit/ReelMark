import { Suspense } from 'react';
import {
	getWatchlistBucketWithProgress,
	getWatchlistCounts,
} from '@/lib/data/watchlist';
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
import { LibraryViewSkeleton } from '@/components/library/LibraryViewSkeleton';
import { MediaTypeSwitcherSkeleton } from '@/components/media/card/MediaTypeSwitcherSkeleton';
import { getGenres } from '@/lib/tmdb';
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
	searchParams: Promise<{ type?: string }>;
};

async function LibrarySubtitle({ t }: { t: Translations }) {
	const counts = await getWatchlistCounts();
	const subtitle = (type: MediaType) => {
		const byStatus = counts[type];
		const count = byStatus.to_watch + byStatus.watched + byStatus.abandoned;
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

/**
 * Ne rend qu'un compartiment : le type demandé, statut « à voir », celui que l'écran ouvre.
 * Les cinq autres arrivent après hydratation — les envoyer tous revenait à sérialiser deux
 * mille entrées pour en afficher trois cents.
 */
async function LibraryContent({
	lang,
	type,
}: {
	lang: Language;
	type: MediaType;
}) {
	const [initialBucket, counts, genreNames, ratingByKey] = await Promise.all([
		getWatchlistBucketWithProgress(type, 'to_watch', lang),
		getWatchlistCounts(),
		getGenres(lang),
		getMyReviewRatings(),
	]);

	return (
		<>
			<ListMetadataBackfill />
			<LibraryView
				initialType={type}
				initialStatus="to_watch"
				initialBucket={initialBucket}
				counts={counts}
				genreNames={genreNames}
				ratingByKey={ratingByKey}
				lang={lang}
			/>
		</>
	);
}

export default async function LibraryPage({
	params: paramsPromise,
	searchParams: searchParamsPromise,
}: Props) {
	const { lang } = await paramsPromise;
	const { type: typeParam } = await searchParamsPromise;
	const type: MediaType = typeParam === 'tv' ? 'tv' : 'movie';
	const t = await getTranslations(lang);

	return (
		<PageLayout>
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

			<Suspense fallback={<MediaTypeSwitcherSkeleton />}>
				<MediaTypeSwitcher defaultType="movie" shallow />
			</Suspense>

			<Suspense fallback={<LibraryViewSkeleton />}>
				<LibraryContent lang={lang} type={type} />
			</Suspense>
		</PageLayout>
	);
}
