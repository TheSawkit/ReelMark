'use client';

import Image from 'next/image';
import { ChevronDown, Play } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/i18n/context';
import { getImageUrl } from '@/lib/tmdb/images';
import { cn } from '@/lib/utils';
import {
	watchNowClass,
	type WatchNowOption,
	type WatchNowVariant,
} from '@/lib/watch-now';

interface WatchNowMenuProps {
	options: WatchNowOption[];
	variant: WatchNowVariant;
}

/** Platform picker used when several of the user's services carry the title. */
export function WatchNowMenu({ options, variant }: WatchNowMenuProps) {
	const { t } = useTranslation();
	const labelClass = variant === 'bar' ? 'inline max-lg:hidden' : undefined;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={t.movie.watchNow}
				className={cn(watchNowClass(variant), 'cursor-pointer')}
			>
				<Play className="h-4 w-4 fill-current" aria-hidden />
				<span className={labelClass}>{t.movie.watchNow}</span>
				<ChevronDown
					className={cn('h-4 w-4', labelClass)}
					aria-hidden
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-56">
				<DropdownMenuLabel className="text-muted">
					{t.movie.chooseProvider}
				</DropdownMenuLabel>
				{options.map((option) => (
					<DropdownMenuItem key={option.providerId} asChild>
						<a
							href={option.href}
							target="_blank"
							rel="noopener noreferrer"
							className="min-h-11 cursor-pointer gap-3"
						>
							<Image
								src={getImageUrl(option.logoPath, 'w92')}
								alt=""
								width={28}
								height={28}
								unoptimized
								className="rounded-md border border-border-subtle"
							/>
							<span className="font-medium">
								{option.providerName}
							</span>
						</a>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
