import type { Metadata } from 'next';
import type { Video, MediaType } from '@/types/tmdb';
import { getMovieDetails, getTvShowDetails } from '@/lib/tmdb';
import { buildMediaMetadata, BASE_URL } from '@/lib/metadata';
import { getTranslations } from '@/lib/i18n/server';

/** Filters and sorts YouTube trailers/teasers by official status. */
export function filterTrailers(videos: Video[]): Video[] {
  return videos
    .filter(
      (v) =>
        v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    )
    .sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0));
}

/** Builds canonical Metadata for a movie or TV show detail page. */
export async function buildMediaDetailMetadata(
  type: MediaType,
  id: number
): Promise<Metadata> {
  const t = await getTranslations();
  const defaultDesc =
    type === 'movie'
      ? t.metadata.defaultMovieDescription
      : t.metadata.defaultTvDescription;

  try {
    if (type === 'movie') {
      const details = await getMovieDetails(id);
      const description =
        details.overview ||
        t.metadata.watchMovieOn.replace('${title}', details.title);
      return buildMediaMetadata({
        title: details.title,
        description,
        backdropPath: details.backdrop_path,
        canonical: `${BASE_URL}/movie/${id}`,
        ogType: 'video.movie',
      });
    } else {
      const details = await getTvShowDetails(id);
      const description =
        details.overview ||
        t.metadata.watchShowOn.replace('${title}', details.name);
      return buildMediaMetadata({
        title: details.name,
        description,
        backdropPath: details.backdrop_path,
        canonical: `${BASE_URL}/tv/${id}`,
        ogType: 'video.tv_show',
      });
    }
  } catch {
    return { title: 'ReelMark', description: defaultDesc };
  }
}
