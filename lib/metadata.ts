import type { Metadata } from 'next';
import { getImageUrl } from '@/lib/tmdb/images';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';
import type { Language } from '@/lib/i18n/translations';

export const BASE_URL = (() => {
	const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
	if (raw && raw.startsWith('http')) return raw;
	return 'https://reelmark.silexio.be';
})();

export const DEFAULT_OG_IMAGE = {
	url: `${BASE_URL}/og`,
	width: 1200,
	height: 630,
};

interface MediaMetadataOptions {
	title: string;
	description: string;
	backdropPath: string | null | undefined;
	lang: Language;
	path: string;
	ogType: 'video.movie' | 'video.tv_show';
}

interface PageMetadataOptions {
	isPrivate?: boolean;
	canonical?: string;
}

/** Builds locale-aware canonical + hreflang alternates for a locale-agnostic app path (routes live under /[lang]). */
export function localizedAlternates(
	lang: Language,
	path: string
): NonNullable<Metadata['alternates']> {
	const url = (l: string) => `${BASE_URL}/${l}${path === '/' ? '' : path}`;
	return {
		canonical: url(lang),
		languages: Object.fromEntries(
			SUPPORTED_LANGUAGES.map((l) => [l, url(l)])
		),
	};
}

/** Builds standard Next.js Metadata for static app pages, avoiding title/description repetition. */
export function buildPageMetadata(
	title: string,
	description: string,
	options?: PageMetadataOptions
): Metadata {
	return {
		title,
		description,
		...(options?.isPrivate && {
			robots: {
				index: false,
				follow: false,
				googleBot: { index: false, follow: false },
			},
		}),
		...(options?.canonical && {
			alternates: { canonical: options.canonical },
		}),
		openGraph: {
			title,
			description,
			type: 'website',
			images: [DEFAULT_OG_IMAGE],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [DEFAULT_OG_IMAGE.url],
		},
	};
}

/** Builds canonical Next.js Metadata for a movie or TV show detail page. */
export function buildMediaMetadata({
	title,
	description,
	backdropPath,
	lang,
	path,
	ogType,
}: MediaMetadataOptions): Metadata {
	const backdropUrl = backdropPath
		? getImageUrl(backdropPath, 'w1280')
		: undefined;
	const images = backdropUrl
		? [{ url: backdropUrl, width: 1280, height: 720 }]
		: [];

	return {
		title,
		description,
		alternates: localizedAlternates(lang, path),
		openGraph: {
			title,
			description,
			type: ogType,
			images: images.length > 0 ? images : undefined,
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: images.length > 0 ? [images[0].url] : undefined,
		},
	};
}
