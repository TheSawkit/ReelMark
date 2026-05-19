'use server'

import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers'
import { fetchTMDB } from '@/lib/tmdb/client'
import { searchMulti } from '@/lib/tmdb/search'
import { VALID_STATUSES, VALID_MEDIA_TYPES, validateRating } from '@/lib/validators'
import type { WatchStatus } from '@/types/tmdb'

export interface ExportData {
    version: 1
    exported_at: string
    watchlist: Array<{
        media_id: number
        media_type: string
        media_title: string
        poster_path: string | null
        status: string
        created_at: string
    }>
    reviews: Array<{
        media_id: number
        media_type: string
        media_title: string
        poster_path: string | null
        rating: number | null
        content: string | null
        created_at: string
    }>
    episode_watches: Array<{
        tv_id: number
        season_number: number
        episode_number: number
        watched_at: string | null
    }>
}

export async function exportUserData(): Promise<ExportData> {
    const { supabase, userId } = await getAuthenticatedUser()

    const [watchlistRes, reviewsRes, episodesRes] = await Promise.all([
        supabase
            .from('watchlist')
            .select('media_id,media_type,media_title,poster_path,status,created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('reviews')
            .select('media_id,media_type,media_title,poster_path,rating,content,created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('episode_watches')
            .select('tv_id,season_number,episode_number,watched_at')
            .eq('user_id', userId),
    ])

    return {
        version: 1,
        exported_at: new Date().toISOString(),
        watchlist: (watchlistRes.data ?? []) as ExportData['watchlist'],
        reviews: (reviewsRes.data ?? []) as ExportData['reviews'],
        episode_watches: (episodesRes.data ?? []) as ExportData['episode_watches'],
    }
}

export interface ImportItem {
    title: string
    year: number | null
    status: WatchStatus
    rating?: number | null
    tmdbId?: number | null
    imdbId?: string | null
    tvdbId?: number | null
    mediaType?: 'movie' | 'tv' | null
    posterPath?: string | null
}

export interface ImportBatchResult {
    imported: number
    failed: string[]
}

interface FindResult {
    id: number
    title: string
    poster_path: string | null
}

type WatchlistRow = {
    user_id: string
    media_id: number
    media_type: 'movie' | 'tv'
    media_title: string
    poster_path: string | null
    status: WatchStatus
}

async function findByImdbId(imdbId: string, expectedType: 'movie' | 'tv'): Promise<FindResult | null> {
    try {
        const data = await fetchTMDB<{
            movie_results: Array<{ id: number; title: string; poster_path: string | null }>
            tv_results: Array<{ id: number; name: string; poster_path: string | null }>
        }>(`/find/${imdbId}`, { external_source: 'imdb_id' }, 86400)

        if (expectedType === 'movie') {
            const r = data.movie_results[0]
            return r ? { id: r.id, title: r.title, poster_path: r.poster_path } : null
        }
        const r = data.tv_results[0]
        return r ? { id: r.id, title: r.name, poster_path: r.poster_path } : null
    } catch {
        return null
    }
}

async function findByTvdbId(tvdbId: number): Promise<FindResult | null> {
    try {
        const data = await fetchTMDB<{
            tv_results: Array<{ id: number; name: string; poster_path: string | null }>
        }>(`/find/${tvdbId}`, { external_source: 'tvdb_id' }, 86400)

        const r = data.tv_results[0]
        return r ? { id: r.id, title: r.name, poster_path: r.poster_path } : null
    } catch {
        return null
    }
}

/**
 * Imports a batch of media items into the user's watchlist, resolving TMDB IDs in priority order:
 * direct TMDB ID → IMDb ID → TVDB ID → title+year search fallback.
 * "watched" entries upgrade existing "to_watch" ones; "to_watch" entries never downgrade "watched" ones.
 */
export async function importBatch(items: ImportItem[]): Promise<ImportBatchResult> {
    if (!Array.isArray(items) || items.length === 0) return { imported: 0, failed: [] }
    if (items.length > 50) throw new Error('Batch size exceeds limit (50)')

    const { supabase, userId } = await getAuthenticatedUser()

    type Resolved = { row: WatchlistRow; rating: number | null } | null

    const resolved = await Promise.all(
        items.map(async (item): Promise<Resolved> => {
            try {
                const status = VALID_STATUSES.has(item.status) ? item.status : 'watched'
                const mediaType: 'movie' | 'tv' =
                    item.mediaType && VALID_MEDIA_TYPES.has(item.mediaType) ? item.mediaType : 'movie'
                const rating = validateRating(item.rating)

                const fallbackTitle = String(item.title).slice(0, 500)
                const resolve = (id: number, type: 'movie' | 'tv', title: string, poster: string | null) => ({
                    row: { user_id: userId, media_id: id, media_type: type, media_title: title || fallbackTitle, poster_path: poster, status },
                    rating,
                })

                if (item.tmdbId && Number.isInteger(item.tmdbId) && item.tmdbId > 0) {
                    return resolve(item.tmdbId, mediaType, fallbackTitle, item.posterPath ?? null)
                }

                if (item.imdbId && /^tt\d+$/.test(item.imdbId)) {
                    const found = await findByImdbId(item.imdbId, mediaType)
                    if (found) return resolve(found.id, mediaType, found.title, found.poster_path)
                }

                if (item.tvdbId && Number.isInteger(item.tvdbId) && item.tvdbId > 0) {
                    const found = await findByTvdbId(item.tvdbId)
                    if (found) return resolve(found.id, 'tv', found.title, found.poster_path)
                }

                const results = await searchMulti(String(item.title).slice(0, 200))
                const candidates = item.mediaType
                    ? results.filter(r => r.media_type === item.mediaType)
                    : results
                const match = item.year
                    ? (candidates.find(r => r.release_date?.startsWith(String(item.year))) ?? candidates[0])
                    : candidates[0]

                if (!match) return null
                return resolve(match.id, match.media_type as 'movie' | 'tv', match.title, match.poster_path)
            } catch {
                return null
            }
        })
    )

    const hits = resolved.filter((r): r is NonNullable<Resolved> => r !== null)
    const rows = hits.map(h => h.row)
    const failed = items
        .filter((_, i) => resolved[i] === null)
        .map(item => item.title)

    if (rows.length === 0) return { imported: 0, failed }

    const watchedRows = rows.filter(r => r.status === 'watched')
    const toWatchRows = rows.filter(r => r.status === 'to_watch')

    const errors = await Promise.all([
        watchedRows.length > 0
            ? supabase.from('watchlist').upsert(watchedRows, { onConflict: 'user_id,media_id,media_type' }).then(r => r.error)
            : Promise.resolve(null),
        toWatchRows.length > 0
            ? supabase.from('watchlist').upsert(toWatchRows, { onConflict: 'user_id,media_id,media_type', ignoreDuplicates: true }).then(r => r.error)
            : Promise.resolve(null),
    ])

    const error = errors.find(Boolean) ?? null

    if (error) return { imported: 0, failed: items.map(i => i.title) }

    const reviewRows = hits
        .filter(h => h.rating !== null)
        .map(h => ({
            user_id: userId,
            media_id: h.row.media_id,
            media_type: h.row.media_type,
            media_title: h.row.media_title,
            poster_path: h.row.poster_path,
            rating: h.rating,
            content: null,
        }))

    if (reviewRows.length > 0) {
        await supabase
            .from('reviews')
            .upsert(reviewRows, { onConflict: 'user_id,media_id,media_type', ignoreDuplicates: true })
    }

    return { imported: rows.length, failed }
}
