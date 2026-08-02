'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Eye } from 'lucide-react';
import { ActionStatusIcon } from '@/components/ui/ActionStatusIcon';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/tmdb/images';
import { localizedHref } from '@/lib/i18n/utils';
import { useTranslation } from '@/lib/i18n/context';
import { setEpisodeWatched } from '@/app/actions/episodes';
import { episodeWatchStore, useTvWatchTotal } from '@/lib/episode-watch-store';
import { mediaWatchStore } from '@/lib/media-watch-store';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';
import { AbandonShowMenu } from '@/components/media/tv/AbandonShowMenu';
import { HorizontalScroll } from '@/components/shared/HorizontalScroll';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { StaggeredItem } from '@/components/ui/StaggeredItem';
import type { ContinueWatchingItem } from '@/lib/data/continue-watching';

const CARD_ANIMATION_DELAY_MS = 50;

interface ContinueWatchingSectionProps {
	items: ContinueWatchingItem[];
}

/** Dashboard row letting the user tick the next unwatched episode of each show they are mid-way through. */
export function ContinueWatchingSection({
	items,
}: ContinueWatchingSectionProps) {
	const { t } = useTranslation();
	const [abandonedIds, setAbandonedIds] = useState<number[]>([]);

	const visible = items.filter((item) => !abandonedIds.includes(item.tvId));
	if (visible.length === 0) return null;

	return (
		<HorizontalScroll
			className="mb-12 lg:mb-16"
			scrollAmount={500}
			title={
				<SectionHeading>
					{t.pages.dashboard.continueWatching}
				</SectionHeading>
			}
		>
			{visible.map((item, index) => (
				<StaggeredItem
					key={item.tvId}
					index={index}
					staggerMs={CARD_ANIMATION_DELAY_MS}
					className="flex-none w-72 snap-start"
				>
					<ContinueWatchingCard
						item={item}
						priority={index < 3}
						onAbandoned={() =>
							setAbandonedIds((ids) => [...ids, item.tvId])
						}
					/>
				</StaggeredItem>
			))}
		</HorizontalScroll>
	);
}

function ContinueWatchingCard({
	item,
	priority,
	onAbandoned,
}: {
	item: ContinueWatchingItem;
	priority: boolean;
	onAbandoned: () => void;
}) {
	const { t, lang } = useTranslation();
	const { loading, error, run } = useOptimisticAction();
	const [queueIndex, setQueueIndex] = useState(0);

	useEffect(() => {
		episodeWatchStore.seed(
			item.tvId,
			item.seasonNumber,
			item.seasonWatchedEpisodes.length,
			item.seasonWatchedEpisodes
		);
		mediaWatchStore.seed('tv', item.tvId, 'to_watch');
	}, [item.tvId, item.seasonNumber, item.seasonWatchedEpisodes]);

	const watchedTotal = useTvWatchTotal(item.tvId, item.seasonWatched);
	const episode = item.queue[queueIndex];

	async function handleWatch() {
		if (!episode) return;

		const previous = episodeWatchStore.get(item.tvId, episode.seasonNumber);

		await run({
			apply: () => {
				episodeWatchStore.setEpisode(
					item.tvId,
					episode.seasonNumber,
					episode.episodeNumber,
					true
				);
				setQueueIndex((index) => index + 1);
			},
			rollback: () => {
				episodeWatchStore.restore(
					item.tvId,
					episode.seasonNumber,
					previous
				);
				setQueueIndex((index) => Math.max(0, index - 1));
			},
			action: () =>
				setEpisodeWatched(
					item.tvId,
					episode.seasonNumber,
					episode.episodeNumber,
					true
				),
			onSuccess: (result) => {
				mediaWatchStore.set('tv', item.tvId, result.tvStatus);
			},
		});
	}

	const seasonHref = localizedHref(
		lang,
		`/tv/${item.tvId}/season/${item.seasonNumber}`
	);
	const episodeCode = episode
		? t.pages.dashboard.episodeCode
				.replace('{season}', String(episode.seasonNumber))
				.replace('{episode}', String(episode.episodeNumber))
		: null;

	return (
		<article className="relative h-full overflow-hidden rounded-poster bg-surface shadow-card border border-border/10 transition-colors duration-(--duration-base) hover:shadow-glow-gold hover:border-gold/40">
			<Link
				href={seasonHref}
				className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				<div className="relative aspect-video w-full overflow-hidden bg-background">
					{episode?.stillPath ? (
						<Image
							src={getImageUrl(episode.stillPath, 'w500')}
							alt={episode.name}
							fill
							unoptimized
							priority={priority}
							className="object-cover"
							sizes="288px"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-sm text-muted">
							{t.movie.noImage}
						</div>
					)}

					{episodeCode && (
						<span className="absolute left-2 top-2 rounded px-2 py-1 text-sm font-bold text-text glass-overlay shadow-card-sm">
							{episodeCode}
						</span>
					)}
				</div>

				<div className="flex flex-1 flex-col gap-1 p-4">
					<h3 className="line-clamp-1 font-bold text-text">
						{item.title}
					</h3>
					<p className="line-clamp-1 text-sm text-muted">
						{episode
							? episode.name
							: t.pages.dashboard.continueWatchingCaughtUp}
					</p>

					<div className="mt-auto pt-3">
						<ProgressBar
							watched={watchedTotal}
							total={item.totalEpisodes}
							className="h-1.5 rounded-full bg-surface-3"
							innerClassName="rounded-full bg-linear-to-r from-primary to-gold"
						/>
						<span className="mt-2 block text-xs font-medium text-muted">
							{watchedTotal}/{item.totalEpisodes}{' '}
							{t.movie.episodes}
						</span>
					</div>
				</div>
			</Link>

			<div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
				{episode ? (
					<button
						onClick={handleWatch}
						disabled={loading}
						aria-label={t.movie.markEpisodeWatched}
						className={cn(
							'flex min-h-10 cursor-pointer items-center gap-2 rounded-md glass-overlay-button px-3 py-2 text-xs font-medium text-text shadow-card-sm',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
							'disabled:cursor-not-allowed disabled:opacity-50'
						)}
					>
						<ActionStatusIcon
							loading={loading}
							error={error}
							icon={Eye}
						/>
						{error
							? t.common.actionError
							: t.movie.markEpisodeWatched}
					</button>
				) : (
					<span className="flex min-h-10 items-center gap-2 rounded-md border border-border/10 bg-primary/65 backdrop-blur-2xl px-3 py-2 text-xs font-medium text-white shadow-card-sm">
						<CheckCircle2 className="h-4 w-4" aria-hidden="true" />
						{t.movie.episodeWatched}
					</span>
				)}

				<AbandonShowMenu tvId={item.tvId} onAbandoned={onAbandoned} />
			</div>
		</article>
	);
}
