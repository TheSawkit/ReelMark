import { describe, it, expect } from 'vitest';
import { isFreshEpisode, recipientsFor } from '@/lib/new-episodes';

describe('isFreshEpisode', () => {
	it('keeps an episode aired today or within the catch-up window', () => {
		expect(isFreshEpisode('2026-09-24', '2026-09-24')).toBe(true);
		expect(isFreshEpisode('2026-09-22', '2026-09-24')).toBe(true);
	});

	it('drops older, future and undated episodes', () => {
		expect(isFreshEpisode('2026-09-21', '2026-09-24')).toBe(false);
		expect(isFreshEpisode('2026-09-25', '2026-09-24')).toBe(false);
		expect(isFreshEpisode(null, '2026-09-24')).toBe(false);
	});

	it('crosses month boundaries', () => {
		expect(isFreshEpisode('2026-09-30', '2026-10-01')).toBe(true);
	});
});

describe('recipientsFor', () => {
	it('skips opted-out and already-notified followers', () => {
		expect(
			recipientsFor(['a', 'b', 'c', 'd'], new Set(['b']), new Set(['c']))
		).toEqual(['a', 'd']);
	});
});
