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

	return (
		<div className="relative mb-8">
			<div className="absolute right-0 top-0 bottom-2 w-12 bg-linear-to-l from-background to-transparent pointer-events-none z-10 md:hidden" />
			<div className="flex overflow-x-scroll overflow-y-visible pb-2 gap-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
				<Link
					href={localizedHref(lang, `/explorer?type=${activeDomain}`)}
					aria-current={path === '/explorer' ? 'page' : undefined}
					className={cn(
						'px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition duration-(--duration-fast) ease-apple',
						path === '/explorer'
							? 'bg-primary text-white shadow-cinema ring-2 ring-primary/40'
							: 'glass-surface text-muted hover:text-text hover:bg-glass-bg-hover shadow-card-xs'
					)}
				>
					{t.explorer.overview}
				</Link>
				{categories.map((category) => (
					<Link
						key={category.href}
						href={localizedHref(lang, category.href)}
						aria-current={
							path === category.href ? 'page' : undefined
						}
						className={cn(
							'inline-flex items-center min-h-11 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition duration-(--duration-fast) ease-apple',
							path === category.href
								? 'bg-primary text-white shadow-cinema ring-2 ring-primary/40'
								: 'glass-surface text-muted hover:text-text hover:bg-glass-bg-hover shadow-card-xs'
						)}
					>
						{category.name}
					</Link>
				))}
			</div>
		</div>
	);
}
