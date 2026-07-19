import {
	getSimilarMovies,
	getSimilarTvShows,
	movieToMediaItem,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import { mergeWithWatchlist } from '@/lib/data/watchlist';
import { MediaSection } from '@/components/media/card/MediaSection';
import { getTranslations } from '@/lib/i18n/server';
import type { MediaType } from '@/types/tmdb';
import type { Language } from '@/lib/i18n/translations';

interface SimilarSectionProps {
	mediaId: number;
	mediaType: MediaType;
	lang: Language;
}

/** "Similar titles" row on a detail page, fed by TMDB's similar endpoint. */
export async function SimilarSection({
	mediaId,
	mediaType,
	lang,
}: SimilarSectionProps) {
	const t = await getTranslations(lang);
	const results =
		mediaType === 'movie'
			? (await getSimilarMovies(mediaId, lang)).map(movieToMediaItem)
			: (await getSimilarTvShows(mediaId, lang)).map(tvShowToMediaItem);

	const withPosters = results.filter((item) => item.poster_path !== null);
	if (withPosters.length === 0) return null;

	const items = await mergeWithWatchlist(withPosters);

	return (
		<MediaSection
			title={t.movie.similarTitle}
			items={items}
			categoryUrl={`/${mediaType}/${mediaId}/similar`}
		/>
	);
}
