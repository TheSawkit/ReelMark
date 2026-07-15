'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
	setEpisodesWatchedUpTo,
	setSeasonWatched,
} from '@/app/actions/episodes';
import { episodeWatchStore } from '@/lib/episode-watch-store';
import { mediaWatchStore } from '@/lib/media-watch-store';
import { dismissCatchUp } from '@/lib/season-catch-up';
import { useTranslation } from '@/lib/i18n/context';
import { useSeasonUndoToast } from '@/hooks/useSeasonUndoToast';
import type { SeasonWatchResult } from '@/app/actions/episodes';

type CatchUpAction = 'upTo' | 'season';

interface SeasonCatchUpPromptProps {
	open: boolean;
	onClose: () => void;
	tvId: number;
	seasonNumber: number;
	episodeNumber: number;
	totalEpisodes: number;
	missingEpisodes: number[];
}

/**
 * Offers to fill the gap left behind an episode the user skipped to, either up to
 * that episode or across the whole season. Refusing silences the prompt for the season.
 */
export function SeasonCatchUpPrompt({
	open,
	onClose,
	tvId,
	seasonNumber,
	episodeNumber,
	totalEpisodes,
	missingEpisodes,
}: SeasonCatchUpPromptProps) {
	const { t } = useTranslation();
	const undoToast = useSeasonUndoToast(tvId, seasonNumber);
	const [pending, setPending] = useState<CatchUpAction | null>(null);

	const description =
		missingEpisodes.length === 1
			? t.movie.catchUpOneMissing.replace(
					'${episode}',
					String(missingEpisodes[0])
				)
			: t.movie.catchUpManyMissing.replace(
					'${count}',
					String(missingEpisodes.length)
				);

	async function run(
		action: CatchUpAction,
		mutate: () => Promise<SeasonWatchResult>
	) {
		if (pending) return;
		setPending(action);
		const previous = episodeWatchStore.get(tvId, seasonNumber);
		if (action === 'upTo') {
			episodeWatchStore.setWatchedUpTo(tvId, seasonNumber, episodeNumber);
		} else {
			episodeWatchStore.setSeason(
				tvId,
				seasonNumber,
				true,
				totalEpisodes
			);
		}
		try {
			const result = await mutate();
			mediaWatchStore.set('tv', tvId, result.tvStatus);
			undoToast(t.movie.catchUpDone, result.previousEpisodes);
			onClose();
		} catch {
			episodeWatchStore.restore(tvId, seasonNumber, previous);
			toast.error(t.common.actionError);
		} finally {
			setPending(null);
		}
	}

	function handleDismiss() {
		if (pending) return;
		dismissCatchUp(tvId, seasonNumber);
		onClose();
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) handleDismiss();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t.movie.catchUpTitle}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="px-5 py-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleDismiss}
						disabled={pending !== null}
					>
						{t.movie.catchUpDismiss}
					</Button>

					{episodeNumber < totalEpisodes && (
						<Button
							variant="secondary"
							size="sm"
							onClick={() =>
								run('season', () =>
									setSeasonWatched(
										tvId,
										seasonNumber,
										totalEpisodes,
										true
									)
								)
							}
							disabled={pending !== null}
						>
							{pending === 'season' && (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
							{t.movie.catchUpWholeSeason}
						</Button>
					)}

					<Button
						size="sm"
						onClick={() =>
							run('upTo', () =>
								setEpisodesWatchedUpTo(
									tvId,
									seasonNumber,
									episodeNumber
								)
							)
						}
						disabled={pending !== null}
					>
						{pending === 'upTo' && (
							<Loader2 className="h-4 w-4 animate-spin" />
						)}
						{t.movie.catchUpConfirm.replace(
							'${episode}',
							String(episodeNumber)
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
