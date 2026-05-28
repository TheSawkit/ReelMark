import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { fetchMoreMedia } from '@/app/actions/media';
import { InfiniteScrollMedia } from '@/components/media/card/InfiniteScrollMedia';
import { CategoryNav } from '@/components/navigation/CategoryNav';
import { getTranslations } from '@/lib/i18n/server';
import { SearchBar } from '@/components/search/SearchBar';
import { PageLayout, PageHeader } from '@/components/layout/PageLayout';
type CategoryPageParams = Promise<{ category: string }>;
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
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const t = await getTranslations();
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
  await requireAuth();

  const { category } = await params;
  const t = await getTranslations();
  const categoryMap = buildCategoryMap(t);

  if (!(category in categoryMap)) {
    notFound();
  }

  const title = categoryMap[category].title;

  const initialItems = await fetchMoreMedia(category, 1);

  return (
    <PageLayout>
      <PageHeader title={title} subtitle={t.pages.explorer.subtitle} />

      <SearchBar />

      <Suspense fallback={<div className="h-10 mb-8" />}>
        <CategoryNav />
      </Suspense>

      <div className="mt-8">
        <InfiniteScrollMedia initialItems={initialItems} category={category} />
      </div>
    </PageLayout>
  );
}
