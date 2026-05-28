import type {
    ActorDetails,
    ActorMovieCredit,
    ActorTvCredit,
} from '@/types/tmdb';
import { fetchTMDB } from './client';

/**
 * @param id - TMDB person ID.
 * @returns Full actor/person details including biography and profile images.
 */
export async function getActorDetails(id: number): Promise<ActorDetails> {
    return fetchTMDB<ActorDetails>(`/person/${id}`, {}, 86400);
}

/**
 * @param id - TMDB person ID.
 * @returns List of movie credits where the person appears as cast.
 */
export async function getActorMovieCredits(
    id: number
): Promise<ActorMovieCredit[]> {
    const { cast } = await fetchTMDB<{ cast: ActorMovieCredit[] }>(
        `/person/${id}/movie_credits`,
        {},
        86400
    );
    return cast;
}

/**
 * @param id - TMDB person ID.
 * @returns List of TV show credits where the person appears as cast.
 */
export async function getActorTvCredits(id: number): Promise<ActorTvCredit[]> {
    const { cast } = await fetchTMDB<{ cast: ActorTvCredit[] }>(
        `/person/${id}/tv_credits`,
        {},
        86400
    );
    return cast;
}
