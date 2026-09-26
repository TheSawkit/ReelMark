'use client';

import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { getMediaHref } from '@/lib/media';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import {
	lastTouchedShowId,
	showWatchedTotal,
	useEpisodeWatchVersion,
} from '@/lib/stores/episode-watch';
import { resumableSlides } from '@/lib/dashboard-hero';
import { riseStyle } from '@/lib/motion';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { PageHeader } from '@/components/layout/PageLayout';
import { CinematicBackdrop } from '@/components/media/detail/CinematicBackdrop';
import { HeroSlideshow } from '@/components/shared/HeroSlideshow';

export interface FeaturedHero {
	id: number;
	media_type: 'movie' | 'tv';
	title: string;
	backdropPath: string | null;
	posterPath: string | null;
	voteAverage: number;
	genres: { id: number; name: string }[];
	progress: { watched: number; total: number } | null;
	resume: boolean;
}

interface DashboardHeroProps {
	items: FeaturedHero[];
	greeting: string;
	resumeLabel: string;
	discoverLabel: string;
}

const MAX_SLIDES = 5;

interface HeroSlideProps {
	item: FeaturedHero;
	isFirst: boolean;
	greeting: string;
	cta: string;
	href: string;
}

function HeroSlide({ item, isFirst, greeting, cta, href }: HeroSlideProps) {
	const Greeting = isFirst ? 'h1' : 'p';
	const watched = item.progress
		? showWatchedTotal(item.id, item.progress.watched)
		: 0;

	return (
		<>
			<CinematicBackdrop
				src={getImageUrl(item.backdropPath ?? item.posterPath, 'w1280')}
				posterPath={item.posterPath}
				alt={item.title}
				priority={isFirst}
			/>

			<div className="hero-scroll-fade relative z-10 container mx-auto flex flex-col items-center gap-3 px-6 text-center md:items-start md:text-left lg:px-12">
				<Greeting
					className="hero-rise text-sm font-semibold text-muted"
					style={riseStyle(0)}
				>
					{greeting}
				</Greeting>
				<h2
					className="hero-rise heading-display line-clamp-2 max-w-3xl text-5xl leading-none text-text drop-shadow-text sm:text-6xl lg:text-7xl"
					style={riseStyle(1)}
				>
					{item.title}
				</h2>
				<p
					className="hero-rise flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted md:justify-start"
					style={riseStyle(2)}
				>
					{item.voteAverage > 0 && (
						<span className="inline-flex items-center gap-1 font-semibold text-gold">
							<Star
								className="h-4 w-4 fill-current"
								aria-hidden
							/>
							{item.voteAverage.toFixed(1)}
						</span>
					)}
					{item.genres
						.slice(0, 3)
						.map((genre) => genre.name)
						.join(' · ')}
				</p>
				{item.progress && item.progress.total > 0 && (
					<ProgressBar
						watched={watched}
						total={item.progress.total}
						className="hero-rise h-1.5 w-full max-w-xs rounded-full bg-surface-3"
						innerClassName="rounded-full bg-linear-to-r from-primary to-gold"
					/>
				)}
				<Link
					href={href}
					className="hero-rise mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-text px-6 font-bold text-background transition-transform duration-(--duration-fast) ease-apple active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
					style={riseStyle(3)}
				>
					<Play className="h-5 w-5 fill-current" aria-hidden />
					{cta}
				</Link>
			</div>
		</>
	);
}

/**
 * Full-bleed "resume" hero opening the dashboard, greeting included (it is the page's title):
 * a slideshow of the shows left to resume. Ticking an episode below re-orders it instantly —
 * the show just watched comes first, a finished one drops out — without a server render.
 */
export function DashboardHero({
	items,
	greeting,
	resumeLabel,
	discoverLabel,
}: DashboardHeroProps) {
	const { lang } = useTranslation();
	useEpisodeWatchVersion();

	const slides = resumableSlides(
		items,
		showWatchedTotal,
		lastTouchedShowId(),
		MAX_SLIDES
	);
	if (slides.length === 0) {
		return (
			<div className="container mx-auto px-6 pt-section md:pt-section-md lg:px-12">
				<PageHeader title={greeting} />
			</div>
		);
	}

	return (
		<section className="hero-stage relative isolate flex flex-col justify-end overflow-hidden banner-pull-top banner-safe-pad pb-8 sm:pb-12">
			<HeroSlideshow
				label={greeting}
				slides={slides.map((item, index) => (
					<HeroSlide
						key={item.id}
						item={item}
						isFirst={index === 0}
						greeting={greeting}
						cta={item.resume ? resumeLabel : discoverLabel}
						href={localizedHref(lang, getMediaHref(item))}
					/>
				))}
			/>
		</section>
	);
}
