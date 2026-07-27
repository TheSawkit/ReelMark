'use client';

import { MoreHorizontal, Ban, RotateCcw, Loader2 } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAbandonShow } from '@/hooks/useAbandonShow';
import { useTranslation } from '@/lib/i18n/context';
import type { MediaWatchStatus } from '@/lib/media-watch-store';

interface AbandonShowMenuProps {
	tvId: number;
	initialStatus?: MediaWatchStatus;
	onAbandoned?: () => void;
	className?: string;
}

/**
 * Overflow menu letting a TV show be abandoned or picked back up, shared by the
 * dashboard row, the show page and the library.
 */
export function AbandonShowMenu({
	tvId,
	initialStatus,
	onAbandoned,
	className,
}: AbandonShowMenuProps) {
	const { t } = useTranslation();
	const { isAbandoned, loading, setAbandoned } = useAbandonShow(
		tvId,
		initialStatus
	);

	async function toggle() {
		const target = !isAbandoned;
		const ok = await setAbandoned(target);
		if (ok && target) onAbandoned?.();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					disabled={loading}
					aria-label={t.movie.moreActions}
					className={cn(
						'flex h-8 w-8 items-center justify-center rounded-full glass-overlay-button text-text',
						'shadow-card-sm cursor-pointer',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
						'disabled:opacity-50 disabled:cursor-not-allowed',
						className
					)}
				>
					{loading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<MoreHorizontal className="h-4 w-4" />
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-52">
				<DropdownMenuItem
					variant={isAbandoned ? 'default' : 'destructive'}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						toggle();
					}}
				>
					{isAbandoned ? (
						<RotateCcw className="mr-2 h-4 w-4" />
					) : (
						<Ban className="mr-2 h-4 w-4" />
					)}
					{isAbandoned ? t.movie.resumeShow : t.movie.abandonShow}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
