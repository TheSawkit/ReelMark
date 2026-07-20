import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchMoreMedia } from '@/app/actions/media';
import { InfiniteScrollMedia } from '@/components/media/card/InfiniteScrollMedia';
import { PosterGridSkeleton } from '@/components/media/card/PosterGridSkeleton';
import { CategoryNav } from '@/components/navigation/CategoryNav';
import { getTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/translations';
import { SearchBar } from '@/components/search/SearchBar';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
type CategoryPageParams = Promise<{ lang: Language; category: string }>;
interface CategoryPageProps {
	params: CategoryPageParams;
}

type CategoryMeta = { title: string; description: string };

function buildCategoryMap(
	t: Awaited<ReturnType<typeof getTranslations>>
): Record<string, CategoryMeta> {
	return {
		popular: {
			title: t.pages.explorer.popular,
			description: t.metadata.categories.popularMovies,
		},
		'top-rated': {
			title: t.pages.explorer.topRated,
			description: t.metadata.categories.topRatedMovies,
		},
		upcoming: {
			title: t.pages.explorer.upcoming,
			description: t.metadata.categories.upcomingMovies,
		},
		'now-playing': {
			title: t.pages.explorer.nowPlaying,
			description: t.metadata.categories.nowPlayingMovies,
		},
		trending: {
			title: t.pages.explorer.trending,
			description: t.metadata.categories.trendingMovies,
		},
		'tv-popular': {
			title: t.pages.explorer.tvPopular,
			description: t.metadata.categories.tvPopular,
		},
		'tv-top-rated': {
			title: t.pages.explorer.tvTopRated,
			description: t.metadata.categories.tvTopRated,
		},
		'tv-trending': {
			title: t.pages.explorer.tvTrending,
			description: t.metadata.categories.tvTrending,
		},
		'tv-airing-today': {
			title: t.pages.explorer.tvAiringToday,
			description: t.metadata.categories.tvAiringToday,
		},
		'tv-on-the-air': {
			title: t.pages.explorer.tvOnTheAir,
			description: t.metadata.categories.tvOnTheAir,
		},
	};
}

/**
 * Generates metadata for dynamic category pages with category-specific titles and descriptions.
 */
/** The category list is finite and known, so every category page is prerendered. */
export async function generateStaticParams() {
	return [
		{ category: 'popular' },
		{ category: 'top-rated' },
		{ category: 'upcoming' },
		{ category: 'now-playing' },
		{ category: 'trending' },
		{ category: 'tv-popular' },
		{ category: 'tv-top-rated' },
		{ category: 'tv-trending' },
		{ category: 'tv-airing-today' },
		{ category: 'tv-on-the-air' },
	];
}

export async function generateMetadata({
	params,
}: CategoryPageProps): Promise<Metadata> {
	const { lang, category } = await params;
	const t = await getTranslations(lang);
	const categoryMap = buildCategoryMap(t);
	const categoryData = categoryMap[category] ?? {
		title: 'ReelMark',
		description: t.metadata.explorerDescription,
	};

	return {
		title: categoryData.title,
		description: categoryData.description,
		openGraph: {
			title: categoryData.title,
			description: categoryData.description,
			type: 'website',
		},
		twitter: {
			card: 'summary',
			title: categoryData.title,
			description: categoryData.description,
		},
	};
}

export default async function CategoryPage({ params }: CategoryPageProps) {
	const { lang, category } = await params;
	const t = await getTranslations(lang);
	const categoryMap = buildCategoryMap(t);

	if (!(category in categoryMap)) {
		notFound();
	}

	const title = categoryMap[category].title;

	return (
		<PageLayout>
			<PageHeader title={title} subtitle={t.pages.explorer.subtitle} />

			<SearchBar />

			<Suspense fallback={<div className="h-10 mb-8" />}>
				<CategoryNav />
			</Suspense>

			<div className="mt-8">
				<Suspense fallback={<PosterGridSkeleton />}>
					<CategoryGrid category={category} />
				</Suspense>
			</div>
		</PageLayout>
	);
}

async function CategoryGrid({ category }: { category: string }) {
	const initialItems = await fetchMoreMedia(category, 1);
	return (
		<InfiniteScrollMedia initialItems={initialItems} category={category} />
	);
}
