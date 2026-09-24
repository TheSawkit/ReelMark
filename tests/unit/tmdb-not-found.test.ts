import { describe, it, expect, vi } from 'vitest';
import { TMDBNotFoundError } from '@/lib/tmdb/errors';

vi.mock('next/navigation', () => ({
	notFound: () => {
		throw new Error('NEXT_NOT_FOUND');
	},
}));

const { notFoundIfMissing } = await import('@/lib/tmdb/not-found');

describe('notFoundIfMissing', () => {
	it('turns a TMDB 404 into the route 404', () => {
		expect(() =>
			notFoundIfMissing(new TMDBNotFoundError('/person/1'))
		).toThrow('NEXT_NOT_FOUND');
	});

	it('rethrows an outage so the error boundary offers a retry', () => {
		const outage = new Error('TMDB API Error: 503 Service Unavailable');
		expect(() => notFoundIfMissing(outage)).toThrow(outage);
	});

	it('rethrows a network timeout', () => {
		const timeout = new Error('TMDB API Error: 0 TimeoutError');
		expect(() => notFoundIfMissing(timeout)).toThrow(timeout);
	});
});
