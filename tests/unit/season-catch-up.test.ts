import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
	isSeasonSkip,
	missingEpisodesBefore,
	isCatchUpDismissed,
	dismissCatchUp,
} from '@/lib/season-catch-up';

describe('isSeasonSkip', () => {
	it('does not trigger on the next episode in order', () => {
		expect(isSeasonSkip(6, new Set([1, 2, 3, 4, 5]))).toBe(false);
	});

	it('triggers when jumping over an episode', () => {
		expect(isSeasonSkip(7, new Set([1, 2, 3, 4, 5]))).toBe(true);
	});

	it('ignores older gaps when the jump is a single step', () => {
		expect(isSeasonSkip(6, new Set([1, 3, 5]))).toBe(false);
	});

	it('triggers on the first episode marked when it is not the first one', () => {
		expect(isSeasonSkip(3, new Set())).toBe(true);
		expect(isSeasonSkip(1, new Set())).toBe(false);
	});

	it('ignores episodes watched after the one being marked', () => {
		expect(isSeasonSkip(4, new Set([8, 9]))).toBe(true);
	});

	it('does not trigger when re-marking an already watched episode', () => {
		expect(isSeasonSkip(4, new Set([1, 2, 3, 4]))).toBe(false);
	});
});

describe('missingEpisodesBefore', () => {
	it('lists every unwatched episode below the marked one', () => {
		expect(missingEpisodesBefore(7, new Set([1, 3, 5]))).toEqual([2, 4, 6]);
	});

	it('returns an empty list when nothing is missing', () => {
		expect(missingEpisodesBefore(4, new Set([1, 2, 3]))).toEqual([]);
	});
});

describe('catch-up dismissal', () => {
	const store = new Map<string, string>();

	beforeEach(() => {
		store.clear();
		Object.defineProperty(globalThis, 'localStorage', {
			configurable: true,
			value: {
				getItem: (key: string) => store.get(key) ?? null,
				setItem: (key: string, value: string) => store.set(key, value),
			},
		});
	});

	afterEach(() => {
		Reflect.deleteProperty(globalThis, 'localStorage');
	});

	it('remembers a refusal per season', () => {
		expect(isCatchUpDismissed(1399, 2)).toBe(false);
		dismissCatchUp(1399, 2);
		expect(isCatchUpDismissed(1399, 2)).toBe(true);
		expect(isCatchUpDismissed(1399, 3)).toBe(false);
		expect(isCatchUpDismissed(1400, 2)).toBe(false);
	});

	it('stays silent when storage is unavailable', () => {
		Reflect.deleteProperty(globalThis, 'localStorage');
		expect(() => dismissCatchUp(1399, 2)).not.toThrow();
		expect(isCatchUpDismissed(1399, 2)).toBe(false);
	});
});
