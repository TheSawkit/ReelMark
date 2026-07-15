'use client';

import { setSeasonWatched } from '@/app/actions/episodes';
import { episodeWatchStore } from '@/lib/episode-watch-store';
import { mediaWatchStore } from '@/lib/media-watch-store';
import { useTranslation } from '@/lib/i18n/context';
import { useAsyncAction } from '@/hooks/useAsyncAction';
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
	const { loading, error, execute } = useAsyncAction();
	const { t } = useTranslation();
	const undoToast = useSeasonUndoToast(tvId, seasonNumber);

	async function toggle(watched: boolean) {
		if (loading) return;

		const previous = episodeWatchStore.get(tvId, seasonNumber);
		episodeWatchStore.setSeason(tvId, seasonNumber, watched, totalEpisodes);

		const result = await execute(() =>
			setSeasonWatched(tvId, seasonNumber, totalEpisodes, watched)
		);
		if (!result) {
			episodeWatchStore.restore(tvId, seasonNumber, previous);
			return;
		}

		mediaWatchStore.set('tv', tvId, result.tvStatus);
		undoToast(
			watched
				? t.movie.seasonMarkedWatched
				: t.movie.seasonMarkedUnwatched,
			result.previousEpisodes
		);
	}

	return { loading, error, toggle };
}
