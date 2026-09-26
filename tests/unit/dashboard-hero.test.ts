import { describe, it, expect } from 'vitest';
import { pickResumableHero, resumableSlides } from '@/lib/dashboard-hero';

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

	it('features the show just watched, even when it is not the first candidate', () => {
		const items = [show(1, 3, 20), show(2, 5, 30), show(3, 0, 8)];

		expect(pickResumableHero(items, serverCounts, 3)?.id).toBe(3);
	});

	it('ignores a just-watched show that has no episode left', () => {
		const items = [show(1, 3, 20), show(2, 10, 10)];

		expect(pickResumableHero(items, serverCounts, 2)?.id).toBe(1);
	});

	it('ignores a just-watched show that is not among the candidates', () => {
		const items = [show(1, 3, 20), show(2, 5, 30)];

		expect(pickResumableHero(items, serverCounts, 99)?.id).toBe(1);
	});
});

describe('resumableSlides', () => {
	it('leads with the featured show, then the other resumable ones in order', () => {
		const slides = resumableSlides(
			[show(1, 10, 10), show(2, 3, 20), show(3, 0, 8), show(4, 1, 5)],
			serverCounts,
			null,
			5
		);
		expect(slides.map((slide) => slide.id)).toEqual([2, 3, 4]);
	});

	it('puts the show just watched first', () => {
		const slides = resumableSlides(
			[show(1, 2, 10), show(2, 3, 20), show(3, 0, 8)],
			serverCounts,
			3,
			5
		);
		expect(slides.map((slide) => slide.id)).toEqual([3, 1, 2]);
	});

	it('drops a show finished during the session', () => {
		const watchedOf = (id: number, serverWatched: number) =>
			id === 2 ? 20 : serverWatched;
		const slides = resumableSlides(
			[show(1, 2, 10), show(2, 3, 20), show(3, 0, 8)],
			watchedOf,
			null,
			5
		);
		expect(slides.map((slide) => slide.id)).toEqual([1, 3]);
	});

	it('caps the number of slides', () => {
		const shows = Array.from({ length: 8 }, (_, i) => show(i + 1, 0, 10));
		expect(resumableSlides(shows, serverCounts, null, 5)).toHaveLength(5);
	});

	it('is empty without candidates', () => {
		expect(resumableSlides([], serverCounts, null, 5)).toEqual([]);
	});
});
