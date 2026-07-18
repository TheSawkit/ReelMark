import type { MovieDetails, TvShowDetails, Credits } from '@/types/tmdb';
import { getImageUrl } from '@/lib/tmdb/images';
import { BASE_URL } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

type StructuredData = Record<string, unknown>;

const MAX_ACTORS = 10;

function person(name: string): StructuredData {
	return { '@type': 'Person', name };
}

function aggregateRating(
	voteAverage: number,
	voteCount: number
): StructuredData | undefined {
	if (voteCount <= 0 || voteAverage <= 0) return undefined;
	return {
		'@type': 'AggregateRating',
		ratingValue: Number(voteAverage.toFixed(1)),
		ratingCount: voteCount,
		bestRating: 10,
		worstRating: 0,
	};
}

/** Builds schema.org Movie structured data for a movie detail page. */
export function movieJsonLd(
	movie: MovieDetails,
	credits: Credits,
	lang: Language
): StructuredData {
	const directors = credits.crew.filter((c) => c.job === 'Director');
	const rating = aggregateRating(movie.vote_average, movie.vote_count);

	return {
		'@context': 'https://schema.org',
		'@type': 'Movie',
		name: movie.title,
		url: `${BASE_URL}/${lang}/movie/${movie.id}`,
		...(movie.overview && { description: movie.overview }),
		...(movie.poster_path && {
			image: getImageUrl(movie.poster_path, 'w500'),
		}),
		...(movie.release_date && { datePublished: movie.release_date }),
		...(movie.genres.length > 0 && {
			genre: movie.genres.map((g) => g.name),
		}),
		...(directors.length > 0 && {
			director: directors.map((d) => person(d.name)),
		}),
		...(credits.cast.length > 0 && {
			actor: credits.cast.slice(0, MAX_ACTORS).map((c) => person(c.name)),
		}),
		...(rating && { aggregateRating: rating }),
	};
}

/** Builds schema.org TVSeries structured data for a TV show detail page. */
export function tvSeriesJsonLd(
	tv: TvShowDetails,
	credits: Credits,
	lang: Language
): StructuredData {
	const rating = aggregateRating(tv.vote_average, tv.vote_count);

	return {
		'@context': 'https://schema.org',
		'@type': 'TVSeries',
		name: tv.name,
		url: `${BASE_URL}/${lang}/tv/${tv.id}`,
		...(tv.overview && { description: tv.overview }),
		...(tv.poster_path && { image: getImageUrl(tv.poster_path, 'w500') }),
		...(tv.first_air_date && { datePublished: tv.first_air_date }),
		numberOfSeasons: tv.number_of_seasons,
		numberOfEpisodes: tv.number_of_episodes,
		...(tv.genres.length > 0 && { genre: tv.genres.map((g) => g.name) }),
		...(tv.created_by.length > 0 && {
			creator: tv.created_by.map((c) => person(c.name)),
		}),
		...(credits.cast.length > 0 && {
			actor: credits.cast.slice(0, MAX_ACTORS).map((c) => person(c.name)),
		}),
		...(rating && { aggregateRating: rating }),
	};
}

/** Builds schema.org WebSite structured data for the landing page. */
export function webSiteJsonLd(lang: Language): StructuredData {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'ReelMark',
		url: `${BASE_URL}/${lang}`,
		inLanguage: lang,
	};
}

/** Builds schema.org Organization structured data for the landing page. */
export function organizationJsonLd(): StructuredData {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'ReelMark',
		url: BASE_URL,
		logo: `${BASE_URL}/maskable_icon_x512.png`,
	};
}

/** Serializes structured data for a JSON-LD script tag, escaping `<` against XSS. */
export function serializeJsonLd(data: StructuredData): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
