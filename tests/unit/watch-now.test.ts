import { describe, expect, it } from 'vitest';
import { matchMyProviders } from '@/lib/watch-now';
import type { WatchProvider } from '@/types/tmdb';

const JUSTWATCH = 'https://justwatch.com/fr/film/dune';

function provider(
	name: string,
	overrides: Partial<WatchProvider> = {}
): WatchProvider {
	return {
		provider_id: 8,
		provider_name: name,
		logo_path: '/netflix.jpg',
		display_priority: 0,
		...overrides,
	};
}

describe('matchMyProviders', () => {
	it('keeps only the services the user subscribes to', () => {
		const options = matchMyProviders(
			[
				provider('Netflix', { web_url: 'https://netflix.com/title/1' }),
				provider('Disney Plus', { provider_id: 337 }),
			],
			[provider('Netflix')],
			JUSTWATCH
		);

		expect(options).toEqual([
			{
				providerId: 8,
				providerName: 'Netflix',
				logoPath: '/netflix.jpg',
				href: 'https://netflix.com/title/1',
			},
		]);
	});

	it('matches on name when the offer comes from Watchmode, whose ids differ from TMDB', () => {
		const options = matchMyProviders(
			[
				provider('Netflix', {
					provider_id: 203,
					logo_path: '',
					logo_url: 'https://watchmode.com/netflix.png',
					web_url: 'https://netflix.com/title/1',
				}),
			],
			[provider('Netflix', { provider_id: 8 })],
			JUSTWATCH
		);

		expect(options).toHaveLength(1);
		expect(options[0].providerId).toBe(8);
		expect(options[0].logoPath).toBe('/netflix.jpg');
	});

	it('folds aliases so one service is not missed across sources', () => {
		const options = matchMyProviders(
			[provider('Max', { provider_id: 1899 })],
			[provider('HBO Max', { provider_id: 384 })],
			JUSTWATCH
		);

		expect(options.map((o) => o.providerName)).toEqual(['HBO Max']);
	});

	it('matches a suffixed variant of the same service', () => {
		const options = matchMyProviders(
			[provider('Netflix Standard with Ads', { provider_id: 1796 })],
			[provider('Netflix', { provider_id: 8 })],
			JUSTWATCH
		);

		expect(options).toHaveLength(1);
	});

	it('does not confuse two short unrelated names', () => {
		expect(
			matchMyProviders(
				[provider('OCS', { provider_id: 56 })],
				[provider('OCS Go', { provider_id: 57 })],
				JUSTWATCH
			)
		).toHaveLength(0);
	});

	it('falls back to the title page when the offer carries no deep link', () => {
		const options = matchMyProviders(
			[provider('Netflix')],
			[provider('Netflix')],
			JUSTWATCH
		);

		expect(options[0].href).toBe(JUSTWATCH);
	});

	it('drops an offer that has no link at all', () => {
		expect(
			matchMyProviders([provider('Netflix')], [provider('Netflix')], '')
		).toHaveLength(0);
	});

	it('deduplicates a service listed twice by the offers', () => {
		const options = matchMyProviders(
			[
				provider('Netflix', { web_url: 'https://netflix.com/title/1' }),
				provider('netflix', { web_url: 'https://netflix.com/title/2' }),
			],
			[provider('Netflix')],
			JUSTWATCH
		);

		expect(options).toHaveLength(1);
		expect(options[0].href).toBe('https://netflix.com/title/1');
	});

	it('returns nothing without offers or without a user selection', () => {
		expect(
			matchMyProviders(undefined, [provider('Netflix')], JUSTWATCH)
		).toHaveLength(0);
		expect(
			matchMyProviders([provider('Netflix')], [], JUSTWATCH)
		).toHaveLength(0);
	});
});
