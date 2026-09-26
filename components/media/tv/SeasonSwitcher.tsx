'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/tmdb/images';
import { localizedHref } from '@/lib/i18n/utils';
import { useTranslation } from '@/lib/i18n/context';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSeasonWatch } from '@/lib/stores/episode-watch';
import { ProgressBar } from '@/components/shared/ProgressBar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import type { SeasonOption } from '@/lib/seasons';

interface SeasonSwitcherProps {
	tvId: number;
	current: number;
	title: string;
	seasons: SeasonOption[];
}

/**
 * The season title doubles as a season picker: a popover on desktop, a bottom sheet below `lg`
 * (where the tab bar lives). Each season is a prefetched link, so switching stays one tap and
 * keeps a shareable URL.
 */
export function SeasonSwitcher({
	tvId,
	current,
	title,
	seasons,
}: SeasonSwitcherProps) {
	const { t } = useTranslation();
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);

	if (seasons.length < 2) return <>{title}</>;

	const trigger = (
		<button
			type="button"
			aria-label={`${title} — ${t.movie.chooseSeason}`}
			className="group inline-flex items-center gap-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
		>
			{title}
			<ChevronDown
				aria-hidden
				className={cn(
					'h-6 w-6 sm:h-8 sm:w-8 shrink-0 text-muted transition-transform duration-(--duration-base) ease-apple group-hover:text-text',
					open && 'rotate-180'
				)}
			/>
		</button>
	);

	const list = (
		<ul className="flex flex-col gap-1">
			{seasons.map((season) => (
				<SeasonRow
					key={season.seasonNumber}
					tvId={tvId}
					season={season}
					isCurrent={season.seasonNumber === current}
					onSelect={() => setOpen(false)}
				/>
			))}
		</ul>
	);

	if (isMobile) {
		return (
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild>{trigger}</SheetTrigger>
				<SheetContent
					side="bottom"
					className="glass-popover max-h-3/4 rounded-t-2xl border-border/10 pb-[env(safe-area-inset-bottom)]"
				>
					<SheetHeader className="px-5 pt-5 pb-0">
						<SheetTitle className="text-left text-text">
							{t.movie.chooseSeason}
						</SheetTitle>
					</SheetHeader>
					<div className="overflow-y-auto px-3 pb-4">{list}</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-80 max-h-96 overflow-y-auto p-2"
			>
				{list}
			</PopoverContent>
		</Popover>
	);
}

function SeasonRow({
	tvId,
	season,
	isCurrent,
	onSelect,
}: {
	tvId: number;
	season: SeasonOption;
	isCurrent: boolean;
	onSelect: () => void;
}) {
	const { t, lang } = useTranslation();
	const watched =
		useSeasonWatch(tvId, season.seasonNumber)?.count ?? season.watched;

	return (
		<li>
			<Link
				href={localizedHref(
					lang,
					`/tv/${tvId}/season/${season.seasonNumber}`
				)}
				onClick={onSelect}
				aria-current={isCurrent ? 'page' : undefined}
				className={cn(
					'flex items-center gap-3 rounded-lg p-2 transition-colors duration-(--duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
					isCurrent ? 'bg-surface-2' : 'hover:bg-surface-2/60'
				)}
			>
				<div className="relative aspect-2/3 w-10 shrink-0 overflow-hidden rounded-sm bg-surface-3">
					{season.posterPath && (
						<Image
							src={getImageUrl(season.posterPath, 'w92')}
							alt=""
							fill
							sizes="40px"
							className="object-cover"
						/>
					)}
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<span className="truncate text-sm font-semibold text-text">
						{season.name}
					</span>
					<span className="text-xs text-muted tabular-nums">
						{watched > 0 ? `${watched}/` : ''}
						{season.episodeCount} {t.movie.episodes}
					</span>
					{watched > 0 && (
						<ProgressBar
							watched={watched}
							total={season.episodeCount}
							className="h-1 w-full rounded-full bg-surface-3"
							innerClassName="rounded-full bg-linear-to-r from-primary to-gold"
						/>
					)}
				</div>
				{isCurrent && (
					<Check className="h-4 w-4 shrink-0 text-gold" aria-hidden />
				)}
			</Link>
		</li>
	);
}
