'use client';

import { useSearchParams } from 'next/navigation';
import { LibraryTabs } from '@/components/library/LibraryTabs';
import { BackToTopButton } from '@/components/shared/BackToTopButton';
import type { MediaType, WatchlistEntry } from '@/types/tmdb';

interface LibraryDataset {
	toWatch: WatchlistEntry[];
	watched: WatchlistEntry[];
	abandoned: WatchlistEntry[];
}

interface LibraryViewProps {
	movie: LibraryDataset;
	tv: LibraryDataset;
	tvProgress: Record<number, { watched: number; total: number }>;
	genreNames: Record<number, string>;
	ratingByKey: Record<string, number>;
}

function useLibraryType(): MediaType {
	const searchParams = useSearchParams();
	return searchParams.get('type') === 'tv' ? 'tv' : 'movie';
}

/**
 * Client shell of the library: both datasets arrive in one server render and the
 * Films/Séries toggle swaps them from the URL without a server round-trip.
 */
export function LibraryView({
	movie,
	tv,
	tvProgress,
	genreNames,
	ratingByKey,
}: LibraryViewProps) {
	const type = useLibraryType();
	const data = type === 'tv' ? tv : movie;

	return (
		<>
			<LibraryTabs
				key={type}
				toWatch={data.toWatch}
				watched={data.watched}
				abandoned={data.abandoned}
				tvProgress={type === 'tv' ? tvProgress : {}}
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
