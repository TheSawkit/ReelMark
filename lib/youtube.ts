const OEMBED_BASE = 'https://www.youtube.com/oembed';
const MAX_CONCURRENT_CHECKS = 5;

async function isYouTubeVideoAvailable(videoKey: string): Promise<boolean> {
    try {
        const url = `${OEMBED_BASE}?url=https://www.youtube.com/watch?v=${videoKey}&format=json`;
        const response = await fetch(url, {
            next: { revalidate: 86400 },
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

async function pooledMap<TIn, TOut>(
    items: TIn[],
    concurrency: number,
    fn: (item: TIn) => Promise<TOut>
): Promise<TOut[]> {
    const results: TOut[] = new Array(items.length);
    let index = 0;

    async function worker() {
        while (index < items.length) {
            const currentIndex = index++;
            results[currentIndex] = await fn(items[currentIndex]);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () =>
            worker()
        )
    );
    return results;
}

export async function filterAvailableVideos<
    T extends { key: string; site: string },
>(videos: T[]): Promise<T[]> {
    const youtubeVideos = videos.filter((v) => v.site === 'YouTube');
    const otherVideos = videos.filter((v) => v.site !== 'YouTube');

    const availabilityResults = await pooledMap(
        youtubeVideos,
        MAX_CONCURRENT_CHECKS,
        async (video) => ({
            video,
            available: await isYouTubeVideoAvailable(video.key),
        })
    );

    const availableYouTube = availabilityResults
        .filter((r) => r.available)
        .map((r) => r.video);

    return [...availableYouTube, ...otherVideos];
}
