'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { setSeasonEpisodes } from '@/app/actions/episodes';
import { episodeWatchStore } from '@/lib/stores/episode-watch';
import { mediaWatchStore } from '@/lib/stores/media-watch';
import { useTranslation } from '@/lib/i18n/context';

/**
 * Returns a success toast carrying an undo action that restores a season to the exact
 * set of episodes it held before a season-wide write.
 */
export function useSeasonUndoToast(tvId: number, seasonNumber: number) {
	const { t } = useTranslation();

	return useCallback(
		(message: string, previousEpisodes: number[]) => {
			toast.success(message, {
				action: {
					label: t.common.undo,
					onClick: async () => {
						const snapshot = episodeWatchStore.get(
							tvId,
							seasonNumber
						);
						episodeWatchStore.setSeasonEpisodes(
							tvId,
							seasonNumber,
							previousEpisodes
						);
						try {
							const result = await setSeasonEpisodes(
								tvId,
								seasonNumber,
								previousEpisodes
							);
							mediaWatchStore.set('tv', tvId, result.tvStatus);
						} catch {
							episodeWatchStore.restore(
								tvId,
								seasonNumber,
								snapshot
							);
							toast.error(t.common.actionError);
						}
					},
				},
			});
		},
		[tvId, seasonNumber, t]
	);
}
