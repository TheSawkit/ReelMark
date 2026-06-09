import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/metadata';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n/config';
import {
	getPopularMovies,
	getTopRatedMovies,
	getPopularTvShows,
	getTopRatedTvShows,
} from '@/lib/tmdb';

type SitemapEntry = MetadataRoute.Sitemap[number];

/** Builds a sitemap entry on the default locale with hreflang alternates for every supported language. */
function localizedEntry(
	path: string,
	rest: Omit<SitemapEntry, 'url' | 'alternates'>
): SitemapEntry {
	const url = (lang: string) => `${BASE_URL}/${lang}${path}`;
	return {
		url: url(DEFAULT_LANGUAGE),
		alternates: {
			languages: Object.fromEntries(
				SUPPORTED_LANGUAGES.map((lang) => [lang, url(lang)])
			),
		},
		...rest,
	};
}

const STATIC_ROUTES: MetadataRoute.Sitemap = [
	localizedEntry('', {
		lastModified: new Date(),
		changeFrequency: 'daily',
		priority: 1,
	}),
	localizedEntry('/login', {
		lastModified: new Date(),
		changeFrequency: 'monthly',
		priority: 0.4,
	}),
	localizedEntry('/signup', {
		lastModified: new Date(),
		changeFrequency: 'monthly',
		priority: 0.4,
	}),
	localizedEntry('/explorer', {
		lastModified: new Date(),
		changeFrequency: 'daily',
		priority: 0.8,
	}),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [moviesP1, moviesP2, topMoviesP1, tvP1, tvP2, topTvP1] =
		await Promise.allSettled([
			getPopularMovies(1),
			getPopularMovies(2),
			getTopRatedMovies(1),
			getPopularTvShows(1),
			getPopularTvShows(2),
			getTopRatedTvShows(1),
		]);

	const movies = [
		...(moviesP1.status === 'fulfilled' ? moviesP1.value : []),
		...(moviesP2.status === 'fulfilled' ? moviesP2.value : []),
		...(topMoviesP1.status === 'fulfilled' ? topMoviesP1.value : []),
	];

	const shows = [
		...(tvP1.status === 'fulfilled' ? tvP1.value : []),
		...(tvP2.status === 'fulfilled' ? tvP2.value : []),
		...(topTvP1.status === 'fulfilled' ? topTvP1.value : []),
	];

	const movieRoutes: MetadataRoute.Sitemap = [
		...new Map(movies.map((m) => [m.id, m])).values(),
	].map((m) =>
		localizedEntry(`/movie/${m.id}`, {
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 0.7,
		})
	);

	const tvRoutes: MetadataRoute.Sitemap = [
		...new Map(shows.map((s) => [s.id, s])).values(),
	].map((s) =>
		localizedEntry(`/tv/${s.id}`, {
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 0.7,
		})
	);

	return [...STATIC_ROUTES, ...movieRoutes, ...tvRoutes];
}
