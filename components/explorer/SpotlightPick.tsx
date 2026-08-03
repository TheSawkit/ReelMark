import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { getMediaHref } from '@/lib/media';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { Grain } from '@/components/effects/Grain';
import { GlowBorder } from '@/components/effects/GlowBorder';
import { HeroTilt } from '@/components/effects/HeroTilt';
import { BlurredPosterBackdrop } from '@/components/shared/BlurredPosterBackdrop';
import type { MediaItem } from '@/types/tmdb';

interface SpotlightPickProps {
	item: MediaItem;
	badgeLabel: string;
	ctaLabel: string;
}

/** Featured "pick of the day" card with an animated glow border. */
export async function SpotlightPick({
	item,
	badgeLabel,
	ctaLabel,
}: SpotlightPickProps) {
	const lang = await getServerLanguage();

	return (
		<div className="mb-10">
			<HeroTilt>
				<GlowBorder radius="var(--radius-banner)">
					<Link
						href={localizedHref(lang, getMediaHref(item))}
						className="group relative block aspect-video overflow-hidden rounded-(--radius-banner) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:aspect-cinema"
					>
						{item.backdrop_path ? (
							<Image
								src={getImageUrl(item.backdrop_path, 'w1280')}
								alt={item.title}
								fill
								priority
								className="object-cover object-center transition-transform duration-(--duration-slow) ease-apple group-hover:scale-[1.03]"
								sizes="(max-width: 1024px) 100vw, 1200px"
							/>
						) : (
							<BlurredPosterBackdrop
								posterPath={item.poster_path}
								variant="banner"
							/>
						)}

						<Grain opacity={0.05} />
						<div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/35 to-transparent" />
						<div className="absolute inset-0 bg-linear-to-r from-black/70 via-transparent to-transparent" />

						<div className="absolute inset-x-0 bottom-0 flex flex-col p-5 sm:p-8 lg:p-10">
							<span className="mb-2 inline-flex items-center gap-1.5 self-start text-xs font-bold uppercase tracking-wide text-gold-bright sm:mb-3">
								<Sparkles className="h-3.5 w-3.5" />
								{badgeLabel}
							</span>
							<h2 className="heading-display line-clamp-2 max-w-3xl text-3xl leading-none text-white drop-shadow-text sm:text-5xl lg:text-6xl">
								{item.title}
							</h2>
							{item.overview && (
								<p className="mt-3 hidden max-w-xl text-white/75 sm:line-clamp-2 sm:text-base">
									{item.overview}
								</p>
							)}
							<span className="mt-4 inline-flex items-center gap-2 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition-transform duration-(--duration-fast) ease-apple group-hover:scale-105 sm:mt-5">
								{ctaLabel}
								<ArrowRight className="h-4 w-4" />
							</span>
						</div>
					</Link>
				</GlowBorder>
			</HeroTilt>
		</div>
	);
}
