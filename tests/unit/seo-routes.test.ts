import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/tmdb', () => ({
	getPopularMovies: async () => [{ id: 550 }],
	getTopRatedMovies: async () => [],
	getPopularTvShows: async () => [{ id: 1399 }],
	getTopRatedTvShows: async () => [],
}));

const { default: robots } = await import('@/app/robots');
const { default: sitemap } = await import('@/app/sitemap');

describe('robots.txt', () => {
	const generalRule = () => {
		const rules = robots().rules;
		const list = Array.isArray(rules) ? rules : [rules];
		return list.find((rule) => rule.userAgent === '*')!;
	};

	it('disallows private pages under every locale prefix, where they actually live', () => {
		expect(generalRule().disallow).toEqual(
			expect.arrayContaining([
				'/en/dashboard',
				'/fr/dashboard',
				'/fr/settings',
				'/en/library',
				'/api/',
			])
		);
	});
});

describe('sitemap.xml', () => {
	it('lists only indexable pages — no noindex auth page', async () => {
		const urls = (await sitemap()).map((entry) => entry.url);
		expect(urls.some((url) => /\/(login|signup)$/.test(url))).toBe(false);
		expect(urls.some((url) => url.endsWith('/movie/550'))).toBe(true);
	});

	it('declares no fake modification date', async () => {
		expect((await sitemap()).every((entry) => !entry.lastModified)).toBe(
			true
		);
	});
});
