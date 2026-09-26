'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref, stripLocale } from '@/lib/i18n/utils';

export function CategoryNav() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const type = searchParams.get('type') || 'movie';
	const { t, lang } = useTranslation();
	const path = stripLocale(pathname);

	const isTvPath = pathname.includes('tv-') || type === 'tv';
	const activeDomain = isTvPath ? 'tv' : 'movie';

	const categories =
		activeDomain === 'movie'
			? [
					{ name: t.explorer.trending, href: '/explorer/trending' },
					{
						name: t.explorer.nowPlaying,
						href: '/explorer/now-playing',
					},
					{ name: t.explorer.popular, href: '/explorer/popular' },
					{ name: t.explorer.topRated, href: '/explorer/top-rated' },
					{ name: t.explorer.upcoming, href: '/explorer/upcoming' },
				]
			: [
					{
						name: t.explorer.tvTrending,
						href: '/explorer/tv-trending',
					},
					{
						name: t.explorer.tvPopular,
						href: '/explorer/tv-popular',
					},
					{
						name: t.explorer.tvTopRated,
						href: '/explorer/tv-top-rated',
					},
					{
						name: t.explorer.tvAiringToday,
						href: '/explorer/tv-airing-today',
					},
					{
						name: t.explorer.tvOnTheAir,
						href: '/explorer/tv-on-the-air',
					},
				];

	const pills = [
		{
			name: t.explorer.overview,
			href: `/explorer?type=${activeDomain}`,
			path: '/explorer',
		},
		...categories.map((category) => ({ ...category, path: category.href })),
	];

	return (
		<div className="relative mb-8">
			<div className="absolute -right-6 inset-y-0 w-12 bg-linear-to-l from-background to-transparent pointer-events-none z-10 md:hidden" />
			<div className="scrollbar-hide flex gap-3 overflow-x-auto -mx-6 px-6 -my-4 py-4 lg:-mx-12 lg:px-12">
				{pills.map((item) => (
					<Link
						key={item.path}
						href={localizedHref(lang, item.href)}
						aria-current={path === item.path ? 'page' : undefined}
						className={cn(
							'inline-flex items-center min-h-11 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition duration-(--duration-fast) ease-apple',
							path === item.path
								? 'bg-primary text-white shadow-cinema ring-2 ring-primary/40'
								: 'glass-surface text-muted hover:text-text hover:bg-glass-bg-hover shadow-card-xs'
						)}
					>
						{item.name}
					</Link>
				))}
			</div>
		</div>
	);
}
