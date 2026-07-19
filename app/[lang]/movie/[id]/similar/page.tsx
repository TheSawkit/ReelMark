import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
	getMovieDetails,
	getSimilarMovies,
	movieToMediaItem,
} from '@/lib/tmdb';
import { RelatedMediaPage } from '@/components/media/RelatedMediaPage';
import { getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata, localizedAlternates } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

export const dynamic = 'force-dynamic';

type SimilarPageParams = Promise<{ lang: Language; id: string }>;
interface SimilarPageProps {
	params: SimilarPageParams;
}

export async function generateMetadata({
	params,
}: SimilarPageProps): Promise<Metadata> {
	const { lang, id } = await params;
	const movieId = parseInt(id);
	if (isNaN(movieId)) return { title: 'ReelMark' };

	const t = await getTranslations(lang);
	try {
		const details = await getMovieDetails(movieId, lang);
		return {
			...buildPageMetadata(
				`${t.movie.similarTitle} — ${details.title}`,
				t.metadata.defaultMovieDescription
			),
			alternates: localizedAlternates(lang, `/movie/${movieId}/similar`),
		};
	} catch {
		return { title: t.movie.similarTitle };
	}
}

export default async function SimilarMoviesPage(props: SimilarPageProps) {
	const { lang, id } = await props.params;
	const movieId = parseInt(id);
	if (isNaN(movieId)) notFound();

	let details;
	try {
		details = await getMovieDetails(movieId, lang);
	} catch {
		notFound();
	}
	const t = await getTranslations(lang);
	const similar = await getSimilarMovies(movieId, lang);

	return (
		<RelatedMediaPage
			title={t.movie.similarTitle}
			subtitle={details.title}
			items={similar.map(movieToMediaItem)}
			emptyLabel={t.pages.search.noResultsMessage}
		/>
	);
}
