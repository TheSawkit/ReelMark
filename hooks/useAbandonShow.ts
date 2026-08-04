'use client';

import { toast } from 'sonner';
import { setWatchlistStatus } from '@/app/actions/watchlist';
import { mediaWatchStore, useMediaWatch } from '@/lib/stores/media-watch';
import { useTranslation } from '@/lib/i18n/context';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface UseAbandonShowResult {
	isAbandoned: boolean;
	loading: boolean;
	setAbandoned: (abandoned: boolean) => Promise<boolean>;
}

/**
 * Abandons a TV show or picks it back up, rendering the change instantly and rolling
 * back on failure. Abandoned shows drop out of the dashboard's continue-watching row.
 */
export function useAbandonShow(
	tvId: number,
	initialStatus?: string
): UseAbandonShowResult {
	const { t } = useTranslation();
	const { loading, execute } = useAsyncAction();
	const status = useMediaWatch('tv', tvId) ?? initialStatus;

	async function setAbandoned(abandoned: boolean): Promise<boolean> {
		if (loading) return false;
		const previous = mediaWatchStore.get('tv', tvId);
		const target = abandoned ? 'abandoned' : 'to_watch';

		mediaWatchStore.set('tv', tvId, target);
		const result = await execute(() =>
			setWatchlistStatus(tvId, 'tv', target)
		);

		if (result === undefined) {
			mediaWatchStore.restore('tv', tvId, previous);
			toast.error(t.common.actionError);
			return false;
		}

		toast.success(abandoned ? t.movie.showAbandoned : t.movie.showResumed);
		return true;
	}

	return { isAbandoned: status === 'abandoned', loading, setAbandoned };
}
