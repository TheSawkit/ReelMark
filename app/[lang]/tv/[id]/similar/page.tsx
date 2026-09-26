import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
	getTvShowDetails,
	getSimilarTvShows,
	tvShowToMediaItem,
} from '@/lib/tmdb';
import { RelatedMediaPage } from '@/components/media/RelatedMediaPage';
import { getTranslations } from '@/lib/i18n/server';
import {
	buildPageMetadata,
	FALLBACK_TITLE,
	localizedAlternates,
} from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';
import { notFoundIfMissing } from '@/lib/tmdb/not-found';

type SimilarPageParams = Promise<{ lang: Language; id: string }>;
interface SimilarPageProps {
	params: SimilarPageParams;
}

/**
 * Sample params so Cache Components can validate this route at build time.
 * Everything else is rendered on demand (`dynamicParams` stays on).
 */
export async function generateStaticParams() {
	return [{ id: '1399' }];
}

export async function generateMetadata({
	params,
}: SimilarPageProps): Promise<Metadata> {
	const { lang, id } = await params;
	const tvId = parseInt(id);
	if (isNaN(tvId)) return { title: FALLBACK_TITLE };

	const t = await getTranslations(lang);
	try {
		const details = await getTvShowDetails(tvId, lang);
		return {
			...buildPageMetadata(
				`${t.movie.similarTitle} — ${details.name}`,
				t.metadata.defaultTvDescription
			),
			alternates: localizedAlternates(lang, `/tv/${tvId}/similar`),
		};
	} catch {
		return { title: t.movie.similarTitle };
	}
}

export default async function SimilarTvShowsPage(props: SimilarPageProps) {
	const { lang, id } = await props.params;
	const tvId = parseInt(id);
	if (isNaN(tvId)) notFound();

	const [details, t, similar] = await Promise.all([
		getTvShowDetails(tvId, lang).catch(notFoundIfMissing),
		getTranslations(lang),
		getSimilarTvShows(tvId, lang),
	]);

	return (
		<RelatedMediaPage
			title={t.movie.similarTitle}
			subtitle={details.name}
			items={similar.map(tvShowToMediaItem)}
			emptyLabel={t.pages.search.noResultsMessage}
		/>
	);
}
