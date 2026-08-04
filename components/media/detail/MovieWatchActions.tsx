'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { WatchButton } from '@/components/media/detail/WatchButton';
import { useTranslation } from '@/lib/i18n/context';
import { getLocale } from '@/lib/i18n/utils';
import { formatDate } from '@/lib/format';
import {
	mediaWatchStore,
	useMediaWatch,
	type MediaWatchStatus,
} from '@/lib/stores/media-watch';

interface MovieWatchActionsProps {
	mediaId: number;
	mediaTitle: string;
	posterPath: string | null;
	releaseDate?: string;
	initialStatus: MediaWatchStatus;
	watchedAt?: string | null;
	variant: 'banner' | 'bar';
}

export function MovieWatchActions({
	mediaId,
	mediaTitle,
	posterPath,
	releaseDate,
	initialStatus,
	watchedAt,
	variant,
}: MovieWatchActionsProps) {
	const { t, lang } = useTranslation();
	const [sessionWatchedAt] = useState(() => new Date().toISOString());

	useEffect(() => {
		mediaWatchStore.seed('movie', mediaId, initialStatus);
	}, [mediaId, initialStatus]);

	const status = useMediaWatch('movie', mediaId) ?? initialStatus;
	const isWatched = status === 'watched';

	const shared = {
		mediaId,
		mediaTitle,
		mediaType: 'movie',
		posterPath,
	} as const;

	if (variant === 'bar') {
		return (
			<>
				{!isWatched && (
					<WatchButton
						{...shared}
						status="to_watch"
						variant="responsive"
						initialIsActive={status === 'to_watch'}
					/>
				)}
				<WatchButton
					{...shared}
					status="watched"
					variant="responsive"
					initialIsActive={isWatched}
					fallbackStatus="to_watch"
					releaseDate={releaseDate}
				/>
			</>
		);
	}

	const watchedDate = isWatched ? (watchedAt ?? sessionWatchedAt) : null;

	return (
		<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
			{!isWatched && (
				<div className="w-full sm:w-auto">
					<WatchButton
						{...shared}
						status="to_watch"
						variant="full"
						initialIsActive={status === 'to_watch'}
					/>
				</div>
			)}
			<div className="w-full sm:w-auto">
				<WatchButton
					{...shared}
					status="watched"
					variant="full"
					initialIsActive={isWatched}
					fallbackStatus="to_watch"
					releaseDate={releaseDate}
				/>
			</div>
			{watchedDate && (
				<div className="flex items-center gap-2 px-4 py-2 rounded-md glass-overlay text-muted animate-in fade-in slide-in-from-left-4 duration-(--duration-slow)">
					<Eye className="h-4 w-4 shrink-0" />
					<span className="text-sm font-medium">
						{t.movie.watchedOn}{' '}
						{formatDate(watchedDate, getLocale(lang))}
					</span>
				</div>
			)}
		</div>
	);
}
