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
		<div className="flex w-full items-center gap-2 sm:w-auto">
			{!isWatched && (
				<WatchButton
					{...shared}
					status="to_watch"
					variant="pill"
					initialIsActive={status === 'to_watch'}
				/>
			)}
			<WatchButton
				{...shared}
				status="watched"
				variant="pill"
				initialIsActive={isWatched}
				fallbackStatus="to_watch"
				releaseDate={releaseDate}
			/>
			{watchedDate && (
				<span className="flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-sm text-muted">
					<Eye className="h-4 w-4 shrink-0" aria-hidden />
					{t.movie.watchedOn}{' '}
					{formatDate(watchedDate, getLocale(lang))}
				</span>
			)}
		</div>
	);
}
