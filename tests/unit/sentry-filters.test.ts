import { describe, it, expect } from 'vitest';
import type { ErrorEvent } from '@sentry/nextjs';
import { filterServerEvent } from '@/lib/sentry-filters';

function eventWith(value: string): ErrorEvent {
	return {
		type: undefined,
		exception: { values: [{ type: 'Error', value }] },
	};
}

describe('filterServerEvent', () => {
	it('drops the rejection Next raises when it stops a prerender — React handles it, Next 16.3 still reports it', () => {
		const error = Object.assign(
			new Error('During prerendering, `headers()` rejects…'),
			{
				digest: 'HANGING_PROMISE_REJECTION',
			}
		);
		expect(
			filterServerEvent(eventWith(error.message), {
				originalException: error,
			})
		).toBeNull();
	});

	it('groups an upstream API failure into one issue per kind, whatever the page', () => {
		const first = filterServerEvent(
			eventWith('TMDB API Error: 429 Too Many Requests'),
			{}
		);
		const second = filterServerEvent(
			eventWith('TMDB API Error: 429 Too Many Requests'),
			{}
		);
		expect(first?.fingerprint).toEqual([
			'upstream-api',
			'TMDB API Error: 429 Too Many Requests',
		]);
		expect(second?.fingerprint).toEqual(first?.fingerprint);
	});

	it('leaves the title out of a TMDB 404 fingerprint', () => {
		expect(
			filterServerEvent(
				eventWith('TMDB API Error: 404 Not Found (/movie/550)'),
				{}
			)?.fingerprint
		).toEqual(['upstream-api', 'TMDB API Error: 404 Not Found']);
	});

	it('keeps default grouping for our own errors', () => {
		const event = filterServerEvent(
			eventWith('Cannot read properties of undefined'),
			{}
		);
		expect(event?.fingerprint).toBeUndefined();
	});
});
