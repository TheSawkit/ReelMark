'use client';

import { useEffect } from 'react';
import { WatchButton } from '@/components/media/detail/WatchButton';
import { AbandonShowMenu } from '@/components/media/tv/AbandonShowMenu';
import {
	mediaWatchStore,
	useMediaWatch,
	type MediaWatchStatus,
} from '@/lib/media-watch-store';

interface TvWatchActionsProps {
	mediaId: number;
	mediaTitle: string;
	posterPath: string | null;
	releaseDate?: string;
	initialStatus: MediaWatchStatus;
	variant: 'banner' | 'bar';
}

export function TvWatchActions({
	mediaId,
	mediaTitle,
	posterPath,
	releaseDate,
	initialStatus,
	variant,
}: TvWatchActionsProps) {
	useEffect(() => {
		mediaWatchStore.seed('tv', mediaId, initialStatus);
	}, [mediaId, initialStatus]);

	const status = useMediaWatch('tv', mediaId) ?? initialStatus;

	return (
		<div className="flex items-center gap-2">
			<div
				className={variant === 'banner' ? 'flex-1 min-w-0' : undefined}
			>
				<WatchButton
					mediaId={mediaId}
					mediaTitle={mediaTitle}
					mediaType="tv"
					posterPath={posterPath}
					status={status === 'watched' ? 'watched' : 'to_watch'}
					variant={variant === 'bar' ? 'responsive' : 'full'}
					initialIsActive={status !== 'none'}
					releaseDate={releaseDate}
				/>
			</div>
			{status !== 'none' && (
				<AbandonShowMenu
					tvId={mediaId}
					initialStatus={status}
					className="h-10 w-10 shrink-0"
				/>
			)}
		</div>
	);
}
