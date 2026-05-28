import { describe, it, expect } from 'vitest';
import { rankMedia } from '@/lib/search/score';
import type { MediaItem } from '@/types/tmdb';

function media(
    overrides: Partial<MediaItem> & { id: number; title: string }
): MediaItem {
    return {
        media_type: 'movie',
        original_title: overrides.title,
        overview: '',
        poster_path: null,
        backdrop_path: null,
        release_date: '',
        vote_average: 0,
        vote_count: 0,
        popularity: 0,
        genre_ids: [],
        ...overrides,
    };
}

describe('rankMedia (2-tier exact + fuzzy)', () => {
    it("ranks 'Harry Potter' first for typo 'Hary potter'", () => {
        const items = [
            media({ id: 1, title: 'Potter Pictures' }),
            media({ id: 2, title: "Harry Potter and the Philosopher's Stone" }),
            media({ id: 3, title: 'Interstellar' }),
        ];
        expect(rankMedia('Hary potter', items)[0].id).toBe(2);
    });

    it("ranks 'Inception' first for typo 'Inseption'", () => {
        const items = [
            media({ id: 1, title: 'Interstellar' }),
            media({ id: 2, title: 'Inception' }),
            media({ id: 3, title: 'Insidious' }),
        ];
        expect(rankMedia('Inseption', items)[0].id).toBe(2);
    });

    it("matches accent-insensitive 'amelie' to 'Amélie'", () => {
        const items = [
            media({ id: 1, title: 'Amour' }),
            media({ id: 2, title: 'Amélie' }),
        ];
        expect(rankMedia('amelie', items)[0].id).toBe(2);
    });

    it('falls back to original_title when localized title diverges', () => {
        const items = [
            media({ id: 1, title: 'Random Movie' }),
            media({
                id: 2,
                title: 'Le Parrain',
                original_title: 'The Godfather',
            }),
        ];
        expect(rankMedia('godfather', items)[0].id).toBe(2);
    });

    it('returns original list unchanged when query is empty', () => {
        const items = [
            media({ id: 1, title: 'Alpha' }),
            media({ id: 2, title: 'Beta' }),
        ];
        expect(rankMedia('', items)).toEqual(items);
    });

    it('returns original list when no item matches the query (no destructive filtering)', () => {
        const items = [
            media({ id: 1, title: 'Alpha' }),
            media({ id: 2, title: 'Beta' }),
        ];
        expect(rankMedia('xyz123nothing', items)).toHaveLength(2);
    });

    it('does not mutate the input array', () => {
        const items = [
            media({ id: 1, title: 'Alpha' }),
            media({ id: 2, title: 'Beta' }),
        ];
        const snapshot = items.map((i) => i.id);
        rankMedia('Beta', items);
        expect(items.map((i) => i.id)).toEqual(snapshot);
    });

    it("places exact-substring 'harry potter' matches before fuzzy ones, ordered by popularity", () => {
        const items = [
            media({ id: 1, title: "Harry's Random Movie", popularity: 999 }),
            media({
                id: 2,
                title: "Harry Potter and the Philosopher's Stone",
                popularity: 1500,
            }),
            media({
                id: 3,
                title: 'Harry Potter and the Chamber of Secrets',
                popularity: 1200,
            }),
        ];
        const ranked = rankMedia('harry potter', items);
        expect(ranked[0].id).toBe(2);
        expect(ranked[1].id).toBe(3);
    });

    it('prioritizes exact equality over prefix over substring', () => {
        const items = [
            media({ id: 1, title: 'The Inception Story' }),
            media({ id: 2, title: 'Inception Returns' }),
            media({ id: 3, title: 'Inception' }),
        ];
        const ranked = rankMedia('inception', items);
        expect(ranked.map((r) => r.id).slice(0, 3)).toEqual([3, 2, 1]);
    });

    it('breaks ties on priority by higher popularity', () => {
        const items = [
            media({ id: 1, title: 'Harry Potter A', popularity: 100 }),
            media({ id: 2, title: 'Harry Potter B', popularity: 999 }),
        ];
        const ranked = rankMedia('harry potter', items);
        expect(ranked[0].id).toBe(2);
    });

    it('uses fuzzy tier 2 only when tier 1 yields nothing', () => {
        const items = [
            media({ id: 1, title: 'Inception' }),
            media({ id: 2, title: 'Interstellar' }),
        ];
        const ranked = rankMedia('Inseption', items);
        expect(ranked[0].id).toBe(1);
    });
});
