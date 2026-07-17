import type {
	CrewDetails,
	CrewMovieCredit,
	CrewTvCredit,
	CrewMovieCrewCredit,
	CrewTvCrewCredit,
} from '@/types/tmdb';
import { fetchTMDB } from './client';
import type { Language } from '@/lib/i18n/translations';

/**
 * @param id - TMDB person ID.
 * @returns Full person/crew details including biography and profile images.
 */
export async function getCrewDetails(
	id: number,
	lang?: Language
): Promise<CrewDetails> {
	return fetchTMDB<CrewDetails>(
		`/person/${id}`,
		{},
		{ revalidate: 86400, lang }
	);
}

/**
 * Returns a person's movie credits, split into acting (cast) and technical (crew) work.
 * Both arrays come from a single TMDB response, so no extra request is made for crew.
 *
 * @param id - TMDB person ID.
 */
export async function getCrewMovieCredits(
	id: number,
	lang?: Language
): Promise<{ cast: CrewMovieCredit[]; crew: CrewMovieCrewCredit[] }> {
	const { cast, crew } = await fetchTMDB<{
		cast: CrewMovieCredit[];
		crew: CrewMovieCrewCredit[];
	}>(`/person/${id}/movie_credits`, {}, { revalidate: 86400, lang });
	return { cast, crew };
}

/**
 * Returns a person's TV credits, split into acting (cast) and technical (crew) work.
 * Both arrays come from a single TMDB response, so no extra request is made for crew.
 *
 * @param id - TMDB person ID.
 */
export async function getCrewTvCredits(
	id: number,
	lang?: Language
): Promise<{ cast: CrewTvCredit[]; crew: CrewTvCrewCredit[] }> {
	const { cast, crew } = await fetchTMDB<{
		cast: CrewTvCredit[];
		crew: CrewTvCrewCredit[];
	}>(`/person/${id}/tv_credits`, {}, { revalidate: 86400, lang });
	return { cast, crew };
}
