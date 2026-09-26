'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { getColorSampleUrl, getImageUrl } from '@/lib/tmdb/images';
import { useDominantColor } from '@/hooks/useDominantColor';
import { useBannerHeader } from '@/hooks/useBannerHeader';
import { riseStyle } from '@/lib/motion';
import { NavbarGradient } from '@/components/navigation/NavbarGradient';
import { CinematicBackdrop } from '@/components/media/detail/CinematicBackdrop';

interface DetailHeroProps {
	title: string;
	heading?: ReactNode;
	backdropUrl: string;
	posterPath: string | null;
	backControl: ReactNode;
	eyebrow?: ReactNode;
	tagline?: string | null;
	meta: ReactNode;
	genres?: { id: number; name: string }[];
	actions?: ReactNode;
}

/**
 * Full-bleed "cinema" hero shared by movie, show and season pages: the art-directed picture fills
 * the stage, the title sits centered on phones and beside the poster on wider screens, and the
 * whole block rises in then drifts away with the scroll (CSS only, see `.hero-*` in globals.css).
 */
export function DetailHero({
	title,
	heading,
	backdropUrl,
	posterPath,
	backControl,
	eyebrow,
	tagline,
	meta,
	genres,
	actions,
}: DetailHeroProps) {
	const bottomRef = useBannerHeader(title);
	const dominantColor = useDominantColor(getColorSampleUrl(backdropUrl));

	return (
		<div className="hero-stage relative isolate w-full flex flex-col justify-end overflow-hidden banner-pull-top banner-safe-pad pb-8 sm:pb-12">
			<NavbarGradient color={dominantColor} />
			<CinematicBackdrop
				src={backdropUrl}
				posterPath={posterPath}
				alt={title}
			/>

			<div className="hero-scroll-fade relative z-10 container mx-auto px-6 lg:px-12">
				<div className="mb-8 flex max-lg:hidden">{backControl}</div>

				<div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-end md:text-left">
					<div className="hero-rise relative aspect-2/3 w-48 lg:w-56 shrink-0 overflow-hidden rounded-lg border-2 border-gold/30 shadow-poster max-md:hidden">
						<Image
							src={getImageUrl(posterPath, 'w500')}
							alt={title}
							fill
							className="object-cover"
							sizes="224px"
						/>
					</div>

					<div className="flex w-full min-w-0 max-w-4xl flex-col items-center gap-3 md:items-start">
						{eyebrow && (
							<div className="hero-rise" style={riseStyle(0)}>
								{eyebrow}
							</div>
						)}
						<h1
							className="hero-rise heading-display text-5xl leading-none text-text drop-shadow-text sm:text-6xl lg:text-7xl"
							style={riseStyle(1)}
						>
							{heading ?? title}
						</h1>
						{tagline && (
							<p
								className="hero-rise line-clamp-3 max-w-2xl text-base italic text-text-muted sm:text-lg"
								style={riseStyle(2)}
							>
								{tagline}
							</p>
						)}
						<div
							className="hero-rise scrollbar-hide flex min-h-11 max-w-full items-center justify-center-safe gap-2 overflow-x-auto md:justify-start"
							style={riseStyle(3)}
						>
							{meta}
						</div>
						{genres && genres.length > 0 && (
							<p
								className="hero-rise max-w-full truncate text-sm text-muted"
								style={riseStyle(3)}
							>
								{genres.map((genre) => genre.name).join(' · ')}
							</p>
						)}
						{actions ? (
							<div
								ref={bottomRef}
								className="hero-rise mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
								style={riseStyle(4)}
							>
								{actions}
							</div>
						) : (
							<div ref={bottomRef} aria-hidden />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
