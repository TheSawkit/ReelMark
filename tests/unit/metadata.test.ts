import { vi, describe, it, expect } from 'vitest';
import {
	buildPageMetadata,
	buildMediaMetadata,
	localizedAlternates,
	BASE_URL,
} from '@/lib/metadata';

vi.mock('@/lib/tmdb/images', () => ({
	getImageUrl: (path: string, size: string) =>
		`https://image.tmdb.org/t/p/${size}${path}`,
}));

describe('BASE_URL', () => {
	it('falls back to reelmark.app when env var is absent', () => {
		expect(BASE_URL).toMatch(/^https?:\/\//);
	});
});

describe('buildPageMetadata', () => {
	it('sets title and description on the base object, openGraph, and twitter', () => {
		const meta = buildPageMetadata('Explore', 'Browse movies and TV shows');
		expect(meta.title).toBe('Explore');
		expect(meta.description).toBe('Browse movies and TV shows');
		expect(meta.openGraph?.title).toBe('Explore');
		expect(meta.openGraph?.description).toBe('Browse movies and TV shows');
		expect(meta.twitter?.title).toBe('Explore');
		expect(meta.twitter?.description).toBe('Browse movies and TV shows');
	});

	it('sets openGraph type to website', () => {
		const meta = buildPageMetadata('Title', 'Desc');
		expect((meta.openGraph as { type?: string })?.type).toBe('website');
	});

	it('sets twitter card to summary', () => {
		const meta = buildPageMetadata('Title', 'Desc');
		expect((meta.twitter as { card: string })?.card).toBe('summary');
	});

	it('adds robots noindex when isPrivate is true', () => {
		const meta = buildPageMetadata('Dashboard', 'Private', {
			isPrivate: true,
		});
		expect((meta.robots as { index: boolean })?.index).toBe(false);
		expect((meta.robots as { follow: boolean })?.follow).toBe(false);
	});

	it('omits robots when isPrivate is false or absent', () => {
		const meta = buildPageMetadata('Home', 'Welcome');
		expect(meta.robots).toBeUndefined();
	});

	it('sets alternates.canonical when provided', () => {
		const meta = buildPageMetadata('Page', 'Desc', {
			canonical: 'https://reelmark.app/page',
		});
		expect(meta.alternates?.canonical).toBe('https://reelmark.app/page');
	});

	it('omits alternates when canonical is absent', () => {
		const meta = buildPageMetadata('Page', 'Desc');
		expect(meta.alternates).toBeUndefined();
	});
});

describe('buildMediaMetadata', () => {
	const base = {
		title: 'Interstellar',
		description: 'A team of explorers travel through a wormhole.',
		backdropPath: '/interstellar_backdrop.jpg',
		lang: 'en' as const,
		path: '/movie/157336',
		ogType: 'video.movie' as const,
	};

	it('sets title, description, and canonical', () => {
		const meta = buildMediaMetadata(base);
		expect(meta.title).toBe('Interstellar');
		expect(meta.description).toBe(
			'A team of explorers travel through a wormhole.'
		);
		expect(meta.alternates?.canonical).toBe(
			'https://reelmark.app/en/movie/157336'
		);
		expect(meta.alternates?.languages).toMatchObject({
			en: 'https://reelmark.app/en/movie/157336',
			fr: 'https://reelmark.app/fr/movie/157336',
		});
	});

	it('sets openGraph type from ogType parameter', () => {
		const meta = buildMediaMetadata(base);
		expect((meta.openGraph as { type?: string })?.type).toBe('video.movie');

		const tvMeta = buildMediaMetadata({ ...base, ogType: 'video.tv_show' });
		expect((tvMeta.openGraph as { type?: string })?.type).toBe(
			'video.tv_show'
		);
	});

	it('populates images when backdropPath is provided', () => {
		const meta = buildMediaMetadata(base);
		const ogImages = meta.openGraph?.images as Array<{
			url: string;
			width: number;
			height: number;
		}>;
		expect(ogImages).toHaveLength(1);
		expect(ogImages[0].url).toContain('interstellar_backdrop.jpg');
		expect(ogImages[0].width).toBe(1280);
		expect(ogImages[0].height).toBe(720);
	});

	it('sets twitter card to summary_large_image', () => {
		const meta = buildMediaMetadata(base);
		expect((meta.twitter as { card: string })?.card).toBe(
			'summary_large_image'
		);
	});

	it('omits images when backdropPath is null', () => {
		const meta = buildMediaMetadata({ ...base, backdropPath: null });
		expect(meta.openGraph?.images).toBeUndefined();
		expect((meta.twitter as { images?: unknown })?.images).toBeUndefined();
	});

	it('omits images when backdropPath is undefined', () => {
		const meta = buildMediaMetadata({ ...base, backdropPath: undefined });
		expect(meta.openGraph?.images).toBeUndefined();
	});
});

describe('localizedAlternates', () => {
	it('builds canonical on the given language with hreflang alternates', () => {
		const alt = localizedAlternates('fr', '/movie/157336');
		expect(alt.canonical).toBe('https://reelmark.app/fr/movie/157336');
		expect(alt.languages).toMatchObject({
			en: 'https://reelmark.app/en/movie/157336',
			fr: 'https://reelmark.app/fr/movie/157336',
		});
	});

	it('maps the root path to the bare locale prefix', () => {
		expect(localizedAlternates('en', '/').canonical).toBe(
			'https://reelmark.app/en'
		);
	});
});
