import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import type { SeasonOption } from '@/lib/seasons';

interface NextSeasonCardProps {
	href: string;
	season: SeasonOption;
	label: string;
	episodesLabel: string;
}

/** End-of-list shortcut to the following season, so finishing one season is a single tap from the next. */
export function NextSeasonCard({
	href,
	season,
	label,
	episodesLabel,
}: NextSeasonCardProps) {
	return (
		<Link
			href={href}
			className="reveal-on-scroll group flex items-center gap-4 rounded-(--radius-xl) border border-border glass-surface p-3 pr-5 transition-colors duration-(--duration-fast) hover:bg-glass-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:max-w-md"
		>
			<div className="relative aspect-2/3 w-14 shrink-0 overflow-hidden rounded-md bg-surface-3">
				{season.posterPath && (
					<Image
						src={getImageUrl(season.posterPath, 'w154')}
						alt=""
						fill
						sizes="56px"
						className="object-cover"
					/>
				)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<span className="text-xs font-bold uppercase tracking-wide text-gold">
					{label}
				</span>
				<span className="heading-display truncate text-2xl leading-none text-text">
					{season.name}
				</span>
				<span className="text-xs text-muted tabular-nums">
					{season.episodeCount} {episodesLabel}
				</span>
			</div>
			<ChevronRight
				aria-hidden
				className="h-5 w-5 shrink-0 text-muted transition-transform duration-(--duration-fast) ease-apple group-hover:translate-x-0.5 group-hover:text-text"
			/>
		</Link>
	);
}
