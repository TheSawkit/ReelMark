import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { getMediaHref } from '@/lib/media';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { riseStyle } from '@/lib/motion';
import { CinematicBackdrop } from '@/components/media/detail/CinematicBackdrop';
import { WatchButton } from '@/components/media/detail/WatchButton';
import type { MediaItem } from '@/types/tmdb';

interface SpotlightPickProps {
	item: MediaItem;
	badgeLabel: string;
	ctaLabel: string;
}

/**
 * Full-bleed "number one this week" hero: fills the Explorer stage it is rendered in (the
 * parent owns the `.hero-stage` box), poster art on phones, backdrop on wider screens.
 */
export async function SpotlightPick({
	item,
	badgeLabel,
	ctaLabel,
}: SpotlightPickProps) {
	const lang = await getServerLanguage();
	const entry = item.watchlistEntry;

	return (
		<>
			<CinematicBackdrop
				src={getImageUrl(
					item.backdrop_path ?? item.poster_path,
					'w1280'
				)}
				posterPath={item.poster_path}
				alt={item.title}
			/>

			<div className="hero-scroll-fade relative z-10 container mx-auto flex flex-col items-center gap-3 px-6 text-center md:items-start md:text-left lg:px-12">
				<span
					className="hero-rise inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold"
					style={riseStyle(0)}
				>
					<Sparkles className="h-3.5 w-3.5" aria-hidden />
					{badgeLabel}
				</span>
				<h2
					className="hero-rise heading-display line-clamp-2 max-w-3xl text-5xl leading-none text-text drop-shadow-text sm:text-6xl lg:text-7xl"
					style={riseStyle(1)}
				>
					{item.title}
				</h2>
				{item.overview && (
					<p
						className="hero-rise line-clamp-2 max-w-xl text-muted max-md:hidden"
						style={riseStyle(2)}
					>
						{item.overview}
					</p>
				)}
				<div
					className="hero-rise mt-2 flex w-full items-center justify-center gap-3 sm:w-auto md:justify-start"
					style={riseStyle(3)}
				>
					<Link
						href={localizedHref(lang, getMediaHref(item))}
						className="group flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-text px-6 text-sm font-bold text-background transition-transform duration-(--duration-fast) ease-apple active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-none sm:text-base"
					>
						{ctaLabel}
						<ArrowRight className="h-4 w-4 transition-transform duration-(--duration-fast) ease-apple group-hover:translate-x-0.5" />
					</Link>
					<WatchButton
						mediaId={item.id}
						mediaTitle={item.title}
						mediaType={item.media_type}
						posterPath={item.poster_path}
						status={
							entry?.status === 'watched' ? 'watched' : 'to_watch'
						}
						initialIsActive={entry !== undefined}
						variant="pill"
					/>
				</div>
			</div>
		</>
	);
}
