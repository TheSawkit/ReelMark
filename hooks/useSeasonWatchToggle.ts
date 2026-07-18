'use client';

import { setSeasonWatched } from '@/app/actions/episodes';
import { episodeWatchStore } from '@/lib/episode-watch-store';
import { mediaWatchStore } from '@/lib/media-watch-store';
import { useTranslation } from '@/lib/i18n/context';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';
import { useSeasonUndoToast } from '@/hooks/useSeasonUndoToast';

interface UseSeasonWatchToggleResult {
	loading: boolean;
	error: boolean;
	toggle: (watched: boolean) => Promise<void>;
}

/**
 * Marks or unmarks a whole season, rendering the change instantly, rolling back on
 * failure and offering an undo that restores the season's exact previous episodes.
 */
export function useSeasonWatchToggle(
	tvId: number,
	seasonNumber: number,
	totalEpisodes: number
): UseSeasonWatchToggleResult {
	const { loading, error, run } = useOptimisticAction();
	const { t } = useTranslation();
	const undoToast = useSeasonUndoToast(tvId, seasonNumber);

	async function toggle(watched: boolean) {
		const previous = episodeWatchStore.get(tvId, seasonNumber);

		await run({
			apply: () =>
				episodeWatchStore.setSeason(
					tvId,
					seasonNumber,
					watched,
					totalEpisodes
				),
			rollback: () =>
				episodeWatchStore.restore(tvId, seasonNumber, previous),
			action: () =>
				setSeasonWatched(tvId, seasonNumber, totalEpisodes, watched),
			onSuccess: (result) => {
				mediaWatchStore.set('tv', tvId, result.tvStatus);
				undoToast(
					watched
						? t.movie.seasonMarkedWatched
						: t.movie.seasonMarkedUnwatched,
					result.previousEpisodes
				);
			},
		});
	}

	return { loading, error, toggle };
}
