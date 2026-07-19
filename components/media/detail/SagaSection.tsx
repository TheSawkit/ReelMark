import { getCollection, movieToMediaItem } from '@/lib/tmdb';
import { mergeWithWatchlist } from '@/lib/data/watchlist';
import { MediaSection } from '@/components/media/card/MediaSection';
import type { MovieCollectionRef } from '@/types/tmdb';
import type { Language } from '@/lib/i18n/translations';

interface SagaSectionProps {
	collection: MovieCollectionRef | null | undefined;
	currentMovieId: number;
	lang: Language;
}

/** Quick access to the other films of the saga the current movie belongs to, in release order. */
export async function SagaSection({
	collection,
	currentMovieId,
	lang,
}: SagaSectionProps) {
	if (!collection) return null;

	const details = await getCollection(collection.id, lang);
	if (!details) return null;

	const parts = details.parts
		.filter(
			(movie) => movie.id !== currentMovieId && movie.poster_path !== null
		)
		.sort((a, b) =>
			(a.release_date || '9999').localeCompare(b.release_date || '9999')
		);
	if (parts.length === 0) return null;

	const items = await mergeWithWatchlist(parts.map(movieToMediaItem));

	return (
		<MediaSection
			title={details.name}
			items={items}
			categoryUrl="/explorer?type=movie"
		/>
	);
}
