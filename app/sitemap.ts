import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/metadata';
import {
	getPopularMovies,
	getTopRatedMovies,
	getPopularTvShows,
	getTopRatedTvShows,
} from '@/lib/tmdb';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
	{
		url: BASE_URL,
		lastModified: new Date(),
		changeFrequency: 'daily',
		priority: 1,
	},
	{
		url: `${BASE_URL}/login`,
		lastModified: new Date(),
		changeFrequency: 'monthly',
		priority: 0.4,
	},
	{
		url: `${BASE_URL}/signup`,
		lastModified: new Date(),
		changeFrequency: 'monthly',
		priority: 0.4,
	},
	{
		url: `${BASE_URL}/explorer`,
		lastModified: new Date(),
		changeFrequency: 'daily',
		priority: 0.8,
	},
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
	].map((m) => ({
		url: `${BASE_URL}/movie/${m.id}`,
		lastModified: new Date(),
		changeFrequency: 'weekly',
		priority: 0.7,
	}));

	const tvRoutes: MetadataRoute.Sitemap = [
		...new Map(shows.map((s) => [s.id, s])).values(),
	].map((s) => ({
		url: `${BASE_URL}/tv/${s.id}`,
		lastModified: new Date(),
		changeFrequency: 'weekly',
		priority: 0.7,
	}));

	return [...STATIC_ROUTES, ...movieRoutes, ...tvRoutes];
}
