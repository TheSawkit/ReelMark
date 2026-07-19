import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCollection, movieToMediaItem } from '@/lib/tmdb';
import { RelatedMediaPage } from '@/components/media/RelatedMediaPage';
import { getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata, localizedAlternates } from '@/lib/metadata';
import type { Language } from '@/lib/i18n/translations';

export const dynamic = 'force-dynamic';

type CollectionPageParams = Promise<{ lang: Language; id: string }>;
interface CollectionPageProps {
	params: CollectionPageParams;
}

export async function generateMetadata({
	params,
}: CollectionPageProps): Promise<Metadata> {
	const { lang, id } = await params;
	const collectionId = parseInt(id);
	if (isNaN(collectionId)) return { title: 'ReelMark' };

	const [t, details] = await Promise.all([
		getTranslations(lang),
		getCollection(collectionId, lang),
	]);
	if (!details) return { title: 'ReelMark' };

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
		getCollection(collectionId, lang),
	]);
	if (!details) notFound();

	const items = [...details.parts]
		.sort((a, b) =>
			(a.release_date || '9999').localeCompare(b.release_date || '9999')
		)
		.map(movieToMediaItem);

	return (
		<RelatedMediaPage
			title={details.name}
			items={items}
			emptyLabel={t.pages.search.noResultsMessage}
		/>
	);
}
