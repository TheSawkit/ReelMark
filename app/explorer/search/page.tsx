import { Suspense } from 'react';
import type { Metadata } from 'next';
import { searchMulti } from '@/lib/tmdb';
import { MediaGrid } from '@/components/media/card/MediaGrid';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchBar } from '@/components/search/SearchBar';
import { getTranslations, type Translations } from '@/lib/i18n/server';
import { Search as SearchIcon } from 'lucide-react';

interface SearchPageProps {
	searchParams: Promise<{ q?: string; query?: string }>;
}

export async function generateMetadata({
	searchParams,
}: SearchPageProps): Promise<Metadata> {
	const params = await searchParams;
	const query = params.q || params.query || '';
	return {
		title: query ? `"${query}" — Search` : 'Search',
		description: query
			? `Search results for "${query}" on ReelMark — movies, TV shows, and crew.`
			: 'Search movies, TV shows, and crew on ReelMark.',
	};
}

async function SearchResults({
	query,
	t,
}: {
	query: string;
	t: Translations;
}) {
	const results = query ? await searchMulti(query) : [];

	const foundMessage = `${t.pages.search.found} ${t.pages.search.foundCount.replace('${count}', String(results.length))}`;

	return (
		<>
			<p className="text-muted -mt-6 mb-8">
				{results.length > 0 ? foundMessage : t.pages.search.noResults}
			</p>

			{results.length > 0 ? (
				<MediaGrid items={results} />
			) : (
				<div className="mt-24 flex flex-col items-center justify-center py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-(--duration-slow)">
					<div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted/10 mb-6">
						<SearchIcon className="w-12 h-12 text-muted/50" />
					</div>
					<h2 className="text-2xl font-semibold text-text mb-2">
						{t.pages.search.noResults}
					</h2>
					<p className="text-lg text-muted max-w-md">
						{t.pages.search.noResultsMessage}
					</p>
				</div>
			)}
		</>
	);
}

export default async function SearchResultsPage({
	searchParams,
}: SearchPageProps) {
	const params = await searchParams;
	const query = params.q || params.query || '';

	const t = await getTranslations();

	return (
		<PageLayout>
			<div
				className="mb-10"
				style={{
					animation:
						'slideUp var(--duration-slower) ease-out forwards',
					opacity: 0,
				}}
			>
				<h1 className="text-3xl font-bold mb-2">
					{t.pages.search.title} &quot;{query}&quot;
				</h1>
			</div>

			<SearchBar />

			<div className="mt-8">
				<Suspense fallback={<PosterGridSkeleton />}>
					<SearchResults query={query} t={t} />
				</Suspense>
			</div>
		</PageLayout>
	);
}
