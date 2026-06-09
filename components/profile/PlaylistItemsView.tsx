'use client';

import { useMemo } from 'react';
import type { MediaItem } from '@/types/tmdb';
import { getMediaKey } from '@/lib/media';
import { SORT_KEYS } from '@/lib/media-list/controls';
import { useMediaListControls } from '@/hooks/useMediaListControls';
import { MediaGrid } from '@/components/media/card/MediaGrid';
import { MediaListControls } from '@/components/media/list/MediaListControls';
import { useTranslation } from '@/lib/i18n/context';

interface PlaylistItemsViewProps {
	items: MediaItem[];
	genreNames: Record<number, string>;
	ratingByKey: Record<string, number>;
	storageKey: string;
}

export function PlaylistItemsView({
	items,
	genreNames,
	ratingByKey,
	storageKey,
}: PlaylistItemsViewProps) {
	const { t } = useTranslation();

	const enriched = useMemo(
		() =>
			items.map((item) => ({
				...item,
				userRating: ratingByKey[getMediaKey(item)] ?? null,
			})),
		[items, ratingByKey]
	);

	const controls = useMediaListControls(enriched, genreNames, storageKey);

	const sortKeys =
		Object.keys(ratingByKey).length > 0
			? SORT_KEYS
			: SORT_KEYS.filter((key) => key !== 'rating');

	return (
		<div className="space-y-6">
			<MediaListControls controls={controls} sortKeys={sortKeys} />
			{controls.items.length === 0 ? (
				<p className="text-muted text-sm py-12 text-center">
					{t.lists.noResults}
				</p>
			) : (
				<MediaGrid items={controls.items} hideRating />
			)}
		</div>
	);
}
