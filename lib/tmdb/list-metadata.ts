import type { MovieDetails, TvShowDetails, MediaType } from '@/types/tmdb';
import { fetchTMDB } from './client';
import type { Language } from '@/lib/i18n/translations';
import { reportSwallowed } from '@/lib/report';

export interface ListMediaMetadata {
	release_date: string | null;
	genre_ids: number[];
	total_episodes: number | null;
}

const LIST_METADATA_REVALIDATE = 86400;

/**
 * Fetches the lightweight metadata a media list needs for sorting and filtering
 * (release date, genre ids, and — for TV — total episode count) in a single cached
 * TMDB details call, so adds and backfills never bypass `proxy.ts`. Returns empty
 * metadata on failure so callers can store a row without throwing.
 *
 * @param mediaId - TMDB media ID.
 * @param mediaType - 'movie' or 'tv'.
 */
export async function getListMediaMetadata(
	mediaId: number,
	mediaType: MediaType,
	lang?: Language
): Promise<ListMediaMetadata> {
	try {
		if (mediaType === 'tv') {
			const details = await fetchTMDB<TvShowDetails>(
				`/tv/${mediaId}`,
				{},
				{ revalidate: LIST_METADATA_REVALIDATE, lang }
			);
			const total = (details.seasons ?? [])
				.filter((s) => s.season_number > 0)
				.reduce((sum, s) => sum + s.episode_count, 0);
			return {
				release_date: details.first_air_date || null,
				genre_ids: (details.genres ?? []).map((g) => g.id),
				total_episodes: total,
			};
		}

		const details = await fetchTMDB<MovieDetails>(
			`/movie/${mediaId}`,
			{},
			{ revalidate: LIST_METADATA_REVALIDATE, lang }
		);
		return {
			release_date: details.release_date || null,
			genre_ids: (details.genres ?? []).map((g) => g.id),
			total_episodes: null,
		};
	} catch (error) {
		reportSwallowed('tmdb/list-metadata', error);

		// Un 404 est une réponse définitive : la fiche n'existe plus côté TMDB. On rend un
		// total terminal pour les séries, sinon la ligne resterait à NULL et /library la
		// refetcherait à chaque rendu. Toute autre panne est transitoire : on ne rend rien,
		// l'appelant réessaiera plus tard.
		const isGone = error instanceof Error && error.message.includes('404');
		return {
			release_date: null,
			genre_ids: [],
			total_episodes: isGone && mediaType === 'tv' ? 0 : null,
		};
	}
}
