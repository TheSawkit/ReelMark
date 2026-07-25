import { describe, it, expect } from 'vitest';
import { orderByWatchRecency } from '@/lib/continue-watching';

const show = (media_id: number, created_at = '2026-01-01T00:00:00Z') => ({
	media_id,
	created_at,
});

const lastWatched = (entries: [number, string][]) => new Map(entries);

describe('orderByWatchRecency', () => {
	it('puts the show whose last episode was watched most recently first', () => {
		const shows = [show(1), show(2), show(3)];
		const ordered = orderByWatchRecency(
			shows,
			lastWatched([
				[1, '2026-07-12T20:08:38Z'],
				[2, '2026-07-25T01:49:46Z'],
				[3, '2026-07-14T18:24:45Z'],
			]),
			{}
		);
		expect(ordered.map((s) => s.media_id)).toEqual([2, 3, 1]);
	});

	it('ranks shows sharing a bulk-import timestamp by progress', () => {
		const sameInstant = '2026-07-12T20:08:38Z';
		const ordered = orderByWatchRecency(
			[show(1), show(2), show(3)],
			lastWatched([
				[1, sameInstant],
				[2, sameInstant],
				[3, sameInstant],
			]),
			{ 1: 5, 2: 51, 3: 18 }
		);
		expect(ordered.map((s) => s.media_id)).toEqual([2, 3, 1]);
	});

	it('falls back to the most recently added show when nothing else separates them', () => {
		const ordered = orderByWatchRecency(
			[
				show(1, '2026-01-01T00:00:00Z'),
				show(2, '2026-06-01T00:00:00Z'),
				show(3, '2026-03-01T00:00:00Z'),
			],
			lastWatched([]),
			{}
		);
		expect(ordered.map((s) => s.media_id)).toEqual([2, 3, 1]);
	});

	it('places never-watched shows after every started one', () => {
		const ordered = orderByWatchRecency(
			[show(1), show(2), show(3)],
			lastWatched([[2, '2026-02-01T00:00:00Z']]),
			{ 1: 0, 2: 1, 3: 0 }
		);
		expect(ordered[0].media_id).toBe(2);
	});

	it('tolerates a missing created_at', () => {
		const ordered = orderByWatchRecency(
			[
				{ media_id: 1, created_at: null },
				{ media_id: 2, created_at: '2026-05-01T00:00:00Z' },
			],
			lastWatched([]),
			{}
		);
		expect(ordered.map((s) => s.media_id)).toEqual([2, 1]);
	});

	it('leaves the input array untouched', () => {
		const shows = [show(1), show(2)];
		orderByWatchRecency(
			shows,
			lastWatched([[2, '2026-07-01T00:00:00Z']]),
			{}
		);
		expect(shows.map((s) => s.media_id)).toEqual([1, 2]);
	});
});
