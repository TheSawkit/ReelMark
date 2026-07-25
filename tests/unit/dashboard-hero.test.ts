import { describe, it, expect } from 'vitest';
import { pickResumableHero } from '@/lib/dashboard-hero';

const show = (id: number, watched: number, total: number) => ({
	id,
	progress: { watched, total },
});

const serverCounts = (id: number, serverWatched: number) => serverWatched;

describe('pickResumableHero', () => {
	it('features the first show that still has episodes left', () => {
		const picked = pickResumableHero(
			[show(1, 10, 10), show(2, 3, 20), show(3, 0, 8)],
			serverCounts
		);
		expect(picked?.id).toBe(2);
	});

	it('promotes the next show once the current one is finished in session', () => {
		const items = [show(1, 9, 10), show(2, 3, 20)];
		const watchedOf = (id: number, serverWatched: number) =>
			id === 1 ? serverWatched + 1 : serverWatched;

		expect(pickResumableHero(items, serverCounts)?.id).toBe(1);
		expect(pickResumableHero(items, watchedOf)?.id).toBe(2);
	});

	it('keeps a show without progress data eligible', () => {
		const picked = pickResumableHero(
			[{ id: 7, progress: null }, show(2, 3, 20)],
			serverCounts
		);
		expect(picked?.id).toBe(7);
	});

	it('falls back to the first candidate when every show is finished', () => {
		const picked = pickResumableHero(
			[show(1, 10, 10), show(2, 20, 20)],
			serverCounts
		);
		expect(picked?.id).toBe(1);
	});

	it('returns undefined without candidates', () => {
		expect(pickResumableHero([], serverCounts)).toBeUndefined();
	});
});
