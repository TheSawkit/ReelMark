'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { WatchlistEntry } from '@/types/tmdb';
import type { PrivacyVisibility } from '@/types/profile';
import type { TvProgress } from '@/lib/tv-progress';
import { useTranslation } from '@/lib/i18n/context';
import { watchlistEntryToMediaItem } from '@/lib/mappers';
import { getMediaKey } from '@/lib/media';
import { SORT_KEYS } from '@/lib/media-list/controls';
import { useMediaListControls } from '@/hooks/useMediaListControls';
import { MediaCard } from '@/components/media/card/MediaCard';
import {
	MEDIA_GRID_COLUMNS,
	MEDIA_GRID_ROW_CLASS,
	VirtualMediaGrid,
} from '@/components/media/card/VirtualMediaGrid';
import { BackToTopButton } from '@/components/shared/BackToTopButton';
import { MediaListControls } from '@/components/media/list/MediaListControls';
import { PrivacyBlock } from '@/components/profile/PrivacyBlock';
import { EmptyState } from '@/components/ui/EmptyState';

type MediaTypeFilter = 'all' | 'movie' | 'tv';

interface WatchlistSectionProps {
	entries: WatchlistEntry[];
	visibility: PrivacyVisibility;
	canView: boolean;
	isOwnProfile: boolean;
	tvProgress: Record<number, TvProgress>;
	sectionKey: string;
	genreNames: Record<number, string>;
	ratingByKey: Record<string, number>;
}

export function WatchlistSection({
	entries,
	visibility,
	canView,
	isOwnProfile,
	tvProgress,
	sectionKey,
	genreNames,
	ratingByKey,
}: WatchlistSectionProps) {
	const { t } = useTranslation();
	const [mediaType, setMediaType] = useState<MediaTypeFilter>('all');

	const allItems = useMemo(
		() =>
			entries.map((entry) => {
				const item = watchlistEntryToMediaItem(entry);
				return {
					...item,
					userRating: ratingByKey[getMediaKey(item)] ?? null,
				};
			}),
		[entries, ratingByKey]
	);

	const typeItems = useMemo(
		() =>
			mediaType === 'all'
				? allItems
				: allItems.filter((item) => item.media_type === mediaType),
		[allItems, mediaType]
	);

	const controls = useMediaListControls(
		typeItems,
		genreNames,
		`reelmark:list:${sectionKey}`
	);

	if (!canView) return <PrivacyBlock visibility={visibility} />;

	if (entries.length === 0) {
		return (
			<EmptyState
				message={t.profile.noContent}
				action={
					isOwnProfile
						? { href: '/explorer', label: t.profile.exploreButton }
						: undefined
				}
			/>
		);
	}

	const movieCount = allItems.filter((i) => i.media_type === 'movie').length;
	const tvCount = allItems.filter((i) => i.media_type === 'tv').length;

	const FILTERS: Array<{
		id: MediaTypeFilter;
		label: string;
		count: number;
	}> = [
		{ id: 'all', label: t.profile.all, count: allItems.length },
		{ id: 'movie', label: t.profile.movies, count: movieCount },
		{ id: 'tv', label: t.profile.series, count: tvCount },
	];

	const sortKeys =
		Object.keys(ratingByKey).length > 0
			? SORT_KEYS
			: SORT_KEYS.filter((key) => key !== 'rating');

	const processed = controls.items;

	return (
		<div>
			<div className="flex gap-1.5 mb-5 flex-wrap">
				{FILTERS.map((f) => (
					<button
						key={f.id}
						onClick={() => setMediaType(f.id)}
						className={cn(
							'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer',
							mediaType === f.id
								? 'bg-primary text-white'
								: 'bg-surface-2 text-muted hover:text-text'
						)}
					>
						{f.label}
						<span
							className={cn(
								'text-xs px-1.5 py-0.5 rounded-full',
								mediaType === f.id
									? 'bg-white/20 text-white'
									: 'bg-surface-3 text-muted'
							)}
						>
							{f.count}
						</span>
					</button>
				))}
			</div>

			<MediaListControls
				controls={controls}
				sortKeys={sortKeys}
				className="mb-5"
			/>

			{processed.length === 0 ? (
				<p className="text-muted text-sm py-12 text-center">
					{t.lists.noResults}
				</p>
			) : (
				<>
					<VirtualMediaGrid
						items={processed}
						columns={MEDIA_GRID_COLUMNS}
						rowClassName={MEDIA_GRID_ROW_CLASS}
						renderItem={(item, index) => (
							<div
								key={getMediaKey(item)}
								className="media-grid-cell"
							>
								<MediaCard
									media={item}
									watchlistEntry={item.watchlistEntry}
									hideRating
									tvProgress={
										item.media_type === 'tv'
											? tvProgress[item.id]
											: undefined
									}
									liveProgress={isOwnProfile}
									imageSize="grid"
									priority={index < 6}
								/>
							</div>
						)}
					/>
					<BackToTopButton />
				</>
			)}
		</div>
	);
}
