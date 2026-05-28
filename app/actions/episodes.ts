'use server';

import { revalidatePath, unstable_cache } from 'next/cache';
import {
    getAuthenticatedUser,
    getOptionalUser,
} from '@/lib/supabase/auth-helpers';
import { SHARED_REVALIDATE_PATHS } from '@/app/actions/_helpers';
import { getTvShowDetails } from '@/lib/tmdb';
import type { SupabaseServerClient } from '@/lib/supabase/server';

const getCachedTvShowDetails = unstable_cache(
    (tvId: number) => getTvShowDetails(tvId),
    ['tv-show-details'],
    { revalidate: 300 }
);

function revalidateEpisodePaths(tvId: number, seasonNumber: number) {
    SHARED_REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
    revalidatePath(`/tv/${tvId}`);
    revalidatePath(`/tv/${tvId}/season/${seasonNumber}`);
}

async function syncTvShowWatchlistStatus(
    supabase: SupabaseServerClient,
    userId: string,
    tvId: number
) {
    const detailsPromise = getCachedTvShowDetails(tvId).then(
        (d) => ({ ok: true as const, data: d }),
        (e) => ({ ok: false as const, error: e })
    );
    const countPromise = supabase
        .from('episode_watches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tv_id', tvId);
    const entryPromise = supabase
        .from('watchlist')
        .select('status')
        .eq('user_id', userId)
        .eq('media_id', tvId)
        .eq('media_type', 'tv')
        .maybeSingle();

    const [detailsResult, { count }, { data: entry }] = await Promise.all([
        detailsPromise,
        countPromise,
        entryPromise,
    ]);

    if (!detailsResult.ok) {
        console.warn(
            '[episodes] Sync watchlist status failed for tvId:',
            tvId,
            detailsResult.error instanceof Error
                ? detailsResult.error.message
                : 'unknown'
        );
        return;
    }
    const details = detailsResult.data;

    const totalEpisodes = (details.seasons ?? [])
        .filter((s: { season_number: number }) => s.season_number > 0)
        .reduce(
            (sum: number, s: { episode_count: number }) =>
                sum + s.episode_count,
            0
        );

    if (totalEpisodes === 0) return;

    const watchedCount = count ?? 0;
    const allWatched = watchedCount >= totalEpisodes;

    const newStatus = allWatched ? 'watched' : 'to_watch';

    if (!entry) {
        await supabase.from('watchlist').insert({
            user_id: userId,
            media_id: tvId,
            media_title: details.name,
            poster_path: details.poster_path,
            status: newStatus,
            media_type: 'tv',
        });
        return;
    }

    if (entry.status !== newStatus) {
        await supabase
            .from('watchlist')
            .update({ status: newStatus })
            .eq('user_id', userId)
            .eq('media_id', tvId)
            .eq('media_type', 'tv');
    }
}

/**
 * Toggles the watched state of a single episode and syncs the parent TV show's watchlist status.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @param episodeNumber - Episode number within the season.
 * @returns `true` if the episode was marked watched, `false` if unmarked.
 */
export async function toggleEpisodeWatch(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
): Promise<boolean> {
    const { supabase, userId } = await getAuthenticatedUser();

    const { data: existing } = await supabase
        .from('episode_watches')
        .select('id')
        .eq('user_id', userId)
        .eq('tv_id', tvId)
        .eq('season_number', seasonNumber)
        .eq('episode_number', episodeNumber)
        .maybeSingle();

    let result: boolean;

    if (existing) {
        const { error: deleteError } = await supabase
            .from('episode_watches')
            .delete()
            .eq('id', existing.id);
        if (deleteError) throw new Error(deleteError.message);
        result = false;
    } else {
        const { error } = await supabase.from('episode_watches').insert({
            user_id: userId,
            tv_id: tvId,
            season_number: seasonNumber,
            episode_number: episodeNumber,
        });
        if (error) throw new Error(error.message);
        result = true;
    }

    await syncTvShowWatchlistStatus(supabase, userId, tvId);
    revalidateEpisodePaths(tvId, seasonNumber);
    return result;
}

/**
 * Marks all episodes in a season as watched, or unmarks them all if every episode
 * is already watched (toggle behavior).
 * Also syncs the parent TV show's watchlist status after the change.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @param totalEpisodes - Total number of episodes in the season.
 */
export async function markSeasonWatched(
    tvId: number,
    seasonNumber: number,
    totalEpisodes: number
): Promise<void> {
    const { supabase, userId } = await getAuthenticatedUser();

    const { data: existing } = await supabase
        .from('episode_watches')
        .select('episode_number')
        .eq('user_id', userId)
        .eq('tv_id', tvId)
        .eq('season_number', seasonNumber);

    const watchedSet = new Set((existing ?? []).map((e) => e.episode_number));
    const allWatched = watchedSet.size === totalEpisodes;

    if (allWatched) {
        await supabase
            .from('episode_watches')
            .delete()
            .eq('user_id', userId)
            .eq('tv_id', tvId)
            .eq('season_number', seasonNumber);
    } else {
        const toInsert = Array.from({ length: totalEpisodes }, (_, i) => i + 1)
            .filter((ep) => !watchedSet.has(ep))
            .map((ep) => ({
                user_id: userId,
                tv_id: tvId,
                season_number: seasonNumber,
                episode_number: ep,
            }));

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('episode_watches')
                .insert(toInsert);
            if (error) throw new Error(error.message);
        }
    }

    await syncTvShowWatchlistStatus(supabase, userId, tvId);
    revalidateEpisodePaths(tvId, seasonNumber);
}

/**
 * Returns the set of watched episode numbers for a given season.
 * Returns an empty set for unauthenticated users.
 *
 * @param tvId - TMDB TV show ID.
 * @param seasonNumber - Season number (1-based).
 * @returns Set of watched episode numbers.
 */
export async function getSeasonEpisodeWatches(
    tvId: number,
    seasonNumber: number
): Promise<Set<number>> {
    const { supabase, userId } = await getOptionalUser();

    if (!userId) return new Set();

    const { data: watches } = await supabase
        .from('episode_watches')
        .select('episode_number')
        .eq('user_id', userId)
        .eq('tv_id', tvId)
        .eq('season_number', seasonNumber);

    return new Set((watches ?? []).map((w) => w.episode_number));
}

export async function getTvShowWatchProgress(
    tvId: number
): Promise<Map<number, number>> {
    const { supabase, userId } = await getOptionalUser();

    if (!userId) return new Map();

    const { data: watches } = await supabase
        .from('episode_watches')
        .select('season_number, episode_number')
        .eq('user_id', userId)
        .eq('tv_id', tvId);

    const progress = new Map<number, number>();
    for (const w of watches ?? []) {
        progress.set(w.season_number, (progress.get(w.season_number) ?? 0) + 1);
    }
    return progress;
}

export async function getAllTvShowsWatchProgress(
    tvIds: number[]
): Promise<Record<number, number>> {
    if (tvIds.length === 0) return {};

    const { supabase, userId } = await getOptionalUser();
    if (!userId) return {};

    const { data: watches } = await supabase
        .from('episode_watches')
        .select('tv_id, episode_number')
        .eq('user_id', userId)
        .in('tv_id', tvIds);

    const totals: Record<number, number> = {};
    for (const w of watches ?? []) {
        totals[w.tv_id] = (totals[w.tv_id] ?? 0) + 1;
    }
    return totals;
}
