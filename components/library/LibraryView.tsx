'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { LibraryTabs } from '@/components/library/LibraryTabs';
import { BackToTopButton } from '@/components/shared/BackToTopButton';
import { fetchLibraryBucket } from '@/app/actions/watchlist';
import {
	libraryBucketStore,
	useLibraryBucketsVersion,
	type LibraryBucketPage,
} from '@/lib/stores/library-bucket';
import type { Language } from '@/lib/i18n/translations';
import type { MediaType, WatchStatus } from '@/types/tmdb';

export type LibraryCounts = Record<MediaType, Record<WatchStatus, number>>;

interface LibraryViewProps {
	initialType: MediaType;
	initialStatus: WatchStatus;
	initialBucket: LibraryBucketPage;
	counts: LibraryCounts;
	genreNames: Record<number, string>;
	ratingByKey: Record<string, number>;
	lang: Language;
}

const STATUSES: WatchStatus[] = ['to_watch', 'watched', 'abandoned'];
const EMPTY_BUCKET: LibraryBucketPage = {
	entries: [],
	tvProgress: {},
	hasMore: false,
};

function useLibraryType(): MediaType {
	const searchParams = useSearchParams();
	return searchParams.get('type') === 'tv' ? 'tv' : 'movie';
}

/**
 * Client shell of the library. The server renders a single bucket — one media type, one
 * status — because that is all a screen shows; sending all six meant serialising two thousand
 * entries to display three hundred. The others land in the bucket store as they are needed,
 * so switching tab or type costs nothing after the first visit.
 */
export function LibraryView({
	initialType,
	initialStatus,
	initialBucket,
	counts,
	genreNames,
	ratingByKey,
	lang,
}: LibraryViewProps) {
	const type = useLibraryType();
	const version = useLibraryBucketsVersion();

	libraryBucketStore.seed(initialType, initialStatus, initialBucket);

	// Les compartiments du type affiché sont préchargés dès l'hydratation, pour que passer
	// d'un onglet à l'autre n'attende pas. L'écriture vit dans le store, hors de l'état React.
	useEffect(() => {
		for (const status of STATUSES) {
			if (counts[type][status] === 0) continue;
			void libraryBucketStore.ensure(
				type,
				status,
				(mediaType, target, page) =>
					fetchLibraryBucket(mediaType, target, lang, page)
			);
		}
	}, [counts, lang, type]);

	const { dataset, loadingStatuses } = useMemo(() => {
		void version;
		const loading = new Set<WatchStatus>();
		const at = (status: WatchStatus) => {
			const bucket = libraryBucketStore.get(type, status);
			if (!bucket && counts[type][status] > 0) loading.add(status);
			return bucket ?? EMPTY_BUCKET;
		};
		return {
			dataset: {
				toWatch: at('to_watch'),
				watched: at('watched'),
				abandoned: at('abandoned'),
			},
			loadingStatuses: loading,
		};
	}, [counts, type, version]);

	return (
		<>
			<LibraryTabs
				key={type}
				toWatch={dataset.toWatch.entries}
				watched={dataset.watched.entries}
				abandoned={dataset.abandoned.entries}
				tvProgress={
					type === 'tv'
						? {
								...dataset.toWatch.tvProgress,
								...dataset.watched.tvProgress,
								...dataset.abandoned.tvProgress,
							}
						: {}
				}
				counts={counts[type]}
				loadingStatuses={loadingStatuses}
				genreNames={genreNames}
				ratingByKey={ratingByKey}
			/>
			<BackToTopButton />
		</>
	);
}

/** Header count line, kept in sync with the toggle from the URL. */
export function LibraryLiveSubtitle({
	movie,
	tv,
}: {
	movie: string;
	tv: string;
}) {
	const type = useLibraryType();
	return <>{type === 'tv' ? tv : movie}</>;
}
