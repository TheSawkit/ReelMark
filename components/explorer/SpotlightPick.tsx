import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { getMediaHref } from '@/lib/media';
import { getServerLanguage } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/utils';
import { Aurora } from '@/components/effects/Aurora';
import { Grain } from '@/components/effects/Grain';
import { GlowBorder } from '@/components/effects/GlowBorder';
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
			<GlowBorder radius={22} pad={1.5}>
				<Link
					href={localizedHref(lang, getMediaHref(item))}
					className="relative block h-52 overflow-hidden rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-56"
				>
					{item.backdrop_path ? (
						<Image
							src={getImageUrl(item.backdrop_path, 'w1280')}
							alt={item.title}
							fill
							className="object-cover object-top"
							sizes="(max-width: 1024px) 100vw, 900px"
						/>
					) : (
						<BlurredPosterBackdrop
							posterPath={item.poster_path}
							variant="banner"
						/>
					)}

					<Aurora intensity={0.5} />
					<Grain opacity={0.06} />
					<div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/45 to-transparent" />

					<div className="absolute inset-0 flex max-w-[80%] flex-col justify-center p-6 sm:max-w-[70%]">
						<span className="mb-2 inline-flex items-center gap-1.5 self-start text-xs font-bold uppercase tracking-wide text-gold-bright">
							<Sparkles className="h-3.5 w-3.5" />
							{badgeLabel}
						</span>
						<h2 className="font-display text-3xl leading-none text-white drop-shadow-text sm:text-4xl">
							{item.title}
						</h2>
						{item.overview && (
							<p className="mt-2 line-clamp-2 max-w-md text-sm text-white/70">
								{item.overview}
							</p>
						)}
						<span className="mt-4 inline-flex items-center gap-2 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black">
							{ctaLabel}
							<ArrowRight className="h-4 w-4" />
						</span>
					</div>
				</Link>
			</GlowBorder>
		</div>
	);
}
