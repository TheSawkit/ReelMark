import { describe, it, expect } from 'vitest';
import { nextCommunityRating } from '@/lib/media-rating-store';

describe('nextCommunityRating', () => {
	it('creates the first rating', () => {
		expect(nextCommunityRating(null, null, 8)).toEqual({
			avg: 8,
			count: 1,
		});
	});

	it('adds a rating to an existing average', () => {
		expect(nextCommunityRating({ avg: 6, count: 3 }, null, 10)).toEqual({
			avg: 7,
			count: 4,
		});
	});

	it('replaces the user own rating without changing the count', () => {
		expect(nextCommunityRating({ avg: 6, count: 3 }, 4, 10)).toEqual({
			avg: 8,
			count: 3,
		});
	});

	it('removes the user rating', () => {
		expect(nextCommunityRating({ avg: 8, count: 4 }, 10, null)).toEqual({
			avg: 22 / 3,
			count: 3,
		});
	});

	it('returns null when the last rating is removed', () => {
		expect(nextCommunityRating({ avg: 7, count: 1 }, 7, null)).toBeNull();
	});

	it('ignores reviews with no rating', () => {
		expect(nextCommunityRating({ avg: 6, count: 2 }, null, null)).toEqual({
			avg: 6,
			count: 2,
		});
	});
});
