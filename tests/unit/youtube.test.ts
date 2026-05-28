import { vi, describe, it, expect, beforeEach } from 'vitest';
import { filterAvailableVideos } from '@/lib/youtube';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => mockFetch.mockReset());

type Video = { key: string; site: string; name: string };

const yt = (key: string): Video => ({
    key,
    site: 'YouTube',
    name: `Video ${key}`,
});
const vimeo = (key: string): Video => ({
    key,
    site: 'Vimeo',
    name: `Vimeo ${key}`,
});

describe('filterAvailableVideos', () => {
    it('returns empty array for empty input', async () => {
        const result = await filterAvailableVideos([]);
        expect(result).toEqual([]);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('includes non-YouTube videos without calling fetch', async () => {
        const result = await filterAvailableVideos([vimeo('abc')]);
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe('abc');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('includes YouTube video when fetch returns ok', async () => {
        mockFetch.mockResolvedValue({ ok: true });
        const result = await filterAvailableVideos([yt('abc123')]);
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe('abc123');
    });

    it('excludes YouTube video when fetch returns not ok', async () => {
        mockFetch.mockResolvedValue({ ok: false });
        const result = await filterAvailableVideos([yt('abc123')]);
        expect(result).toHaveLength(0);
    });

    it('excludes YouTube video when fetch throws', async () => {
        globalThis.fetch = (() => {
            throw new Error('Network error');
        }) as typeof fetch;
        try {
            const result = await filterAvailableVideos([yt('abc123')]);
            expect(result).toHaveLength(0);
        } finally {
            globalThis.fetch = mockFetch as typeof fetch;
        }
    });

    it('returns mix: available YouTube + all non-YouTube, excludes unavailable YouTube', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({ ok: false });

        const input = [yt('available'), yt('unavailable'), vimeo('vimeo1')];
        const result = await filterAvailableVideos(input);

        const keys = result.map((v) => v.key);
        expect(keys).toContain('available');
        expect(keys).toContain('vimeo1');
        expect(keys).not.toContain('unavailable');
    });

    it('returns only non-YouTube videos when all YouTube videos are unavailable', async () => {
        mockFetch.mockResolvedValue({ ok: false });
        const input = [yt('yt1'), yt('yt2'), vimeo('v1')];
        const result = await filterAvailableVideos(input);
        expect(result).toHaveLength(1);
        expect(result[0].site).toBe('Vimeo');
    });

    it('calls fetch with the correct YouTube oEmbed URL', async () => {
        mockFetch.mockResolvedValue({ ok: true });
        await filterAvailableVideos([yt('dQw4w9WgXcQ')]);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('dQw4w9WgXcQ'),
            expect.any(Object)
        );
    });
});
