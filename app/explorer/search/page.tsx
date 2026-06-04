import { Suspense } from 'react';
import type { Metadata } from 'next';
import { searchMulti } from '@/lib/tmdb';
import { MediaGrid } from '@/components/media/card/MediaGrid';
import { SearchBar } from '@/components/search/SearchBar';
import { getTranslations } from '@/lib/i18n/server';
import { Search as SearchIcon } from 'lucide-react';

type Translations = Awaited<ReturnType<typeof getTranslations>>;

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
			? `Search results for "${query}" on ReelMark — movies, TV shows, and actors.`
			: 'Search movies, TV shows, and actors on ReelMark.',
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

function SearchResultsSkeleton() {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
			{Array.from({ length: 12 }).map((_, i) => (
				<div
					key={i}
					className="aspect-2/3 rounded-(--radius-cinema) bg-surface-2 animate-pulse"
				/>
			))}
		</div>
	);
}

export default async function SearchResultsPage({
	searchParams,
}: SearchPageProps) {
	const params = await searchParams;
	const query = params.q || params.query || '';

	const t = await getTranslations();

	return (
		<div className="container mx-auto py-12 px-6">
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
				<Suspense fallback={<SearchResultsSkeleton />}>
					<SearchResults query={query} t={t} />
				</Suspense>
			</div>
		</div>
	);
}
