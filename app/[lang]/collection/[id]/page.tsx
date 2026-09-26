import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchCollection, getCollection, movieToMediaItem } from '@/lib/tmdb';
import { notFoundIfMissing } from '@/lib/tmdb/not-found';
import { RelatedMediaPage } from '@/components/media/RelatedMediaPage';
import { CollectionHero } from '@/components/media/CollectionHero';
import { JsonLd } from '@/components/seo/JsonLd';
import { movieSeriesJsonLd } from '@/lib/structured-data';
import { getTranslations } from '@/lib/i18n/server';
import {
	buildPageMetadata,
	FALLBACK_TITLE,
	localizedAlternates,
} from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

type CollectionPageParams = Promise<{ lang: Language; id: string }>;
interface CollectionPageProps {
	params: CollectionPageParams;
}

/**
 * Sample params so Cache Components can validate this route at build time.
 * Everything else is rendered on demand (`dynamicParams` stays on).
 */
export async function generateStaticParams() {
	return [{ id: '10' }];
}

export async function generateMetadata({
	params,
}: CollectionPageProps): Promise<Metadata> {
	const { lang, id } = await params;
	const collectionId = parseInt(id);
	if (isNaN(collectionId)) return { title: FALLBACK_TITLE };

	const [t, details] = await Promise.all([
		getTranslations(lang),
		getCollection(collectionId, lang),
	]);
	if (!details) return { title: FALLBACK_TITLE };

	return {
		...buildPageMetadata(details.name, t.metadata.defaultMovieDescription),
		alternates: localizedAlternates(lang, `/collection/${collectionId}`),
	};
}

export default async function CollectionPage(props: CollectionPageProps) {
	const { lang, id } = await props.params;
	const collectionId = parseInt(id);
	if (isNaN(collectionId)) notFound();

	const [t, details] = await Promise.all([
		getTranslations(lang),
		fetchCollection(collectionId, lang).catch(notFoundIfMissing),
	]);

	const items = [...details.parts]
		.sort((a, b) =>
			(a.release_date || '9999').localeCompare(b.release_date || '9999')
		)
		.map(movieToMediaItem);

	return (
		<>
			<JsonLd data={movieSeriesJsonLd(details, lang)} />
			<RelatedMediaPage
				title={details.name}
				hero={
					<CollectionHero
						collection={details}
						countLabel={
							details.parts.length > 1
								? t.library.filmsCountPlural
								: t.library.filmsCount
						}
					/>
				}
				items={items}
				emptyLabel={t.pages.search.noResultsMessage}
			/>
		</>
	);
}
