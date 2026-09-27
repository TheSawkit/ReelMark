'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Eye, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionStatusIcon } from '@/components/ui/ActionStatusIcon';
import { addToWatchlist, removeFromWatchlist } from '@/app/actions/watchlist';
import { useTranslation } from '@/lib/i18n/context';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';
import { useIsUnreleased } from '@/hooks/useIsUnreleased';
import { mediaWatchStore, useMediaWatch } from '@/lib/stores/media-watch';
import { episodeWatchStore } from '@/lib/stores/episode-watch';
import { mediaRatingStore } from '@/lib/stores/media-rating';
import { promptStore } from '@/lib/prompts/store';
import type { WatchButtonProps } from '@/types/components';
import type { MediaType, WatchStatus } from '@/types/tmdb';
import type { Translations } from '@/lib/i18n/translations';

const ReviewDialog = dynamic(
	() =>
		import('@/components/media/reviews/ReviewDialog').then(
			(m) => m.ReviewDialog
		),
	{ ssr: false }
);

type Variant = NonNullable<WatchButtonProps['variant']>;
type TargetStatus = WatchStatus | 'none';

interface MediaRef {
	mediaId: number;
	mediaTitle: string;
	mediaType: MediaType;
	posterPath: string | null;
}

const FOCUS_RING =
	'transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none';
const ACTIVE_SOLID =
	'bg-primary/50 text-white border-transparent shadow-card-sm';
const IDLE_SURFACE =
	'bg-surface/70 text-text border-white/10 hover:bg-surface/85 hover:text-text shadow-card-sm';
const IDLE_ON_DARK =
	'bg-black/50 text-white/90 border-white/10 hover:bg-black/65 hover:text-white shadow-card-sm';

const VARIANT_STYLE: Record<
	Variant,
	{
		base: string;
		iconClass?: string;
		labelClass?: string;
		iconOnlyBelowLg?: boolean;
	}
> = {
	pill: {
		base: 'flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap sm:flex-none sm:px-5 active:scale-95',
		iconClass: 'h-4 w-4 shrink-0',
		labelClass: 'truncate',
	},
	responsive: {
		base: 'h-12 w-12 lg:h-auto lg:w-auto lg:min-h-11 lg:px-4 lg:py-2.5 rounded-full lg:rounded-lg flex items-center justify-center gap-2 shrink-0 border text-sm font-semibold',
		iconClass: 'h-4 w-4 shrink-0',
		labelClass: 'inline max-lg:hidden',
		iconOnlyBelowLg: true,
	},
	full: {
		base: 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border min-h-11 w-full shrink-0',
	},
};

function stateClass(
	variant: Variant,
	isActive: boolean,
	onDark: boolean
): string {
	if (variant === 'pill') {
		return isActive
			? 'border-gold/40 bg-gold/15 text-gold'
			: 'glass-surface border-glass-border text-text hover:bg-glass-bg-hover';
	}
	if (isActive) return ACTIVE_SOLID;
	return variant === 'full' && onDark ? IDLE_ON_DARK : IDLE_SURFACE;
}

function buttonClassName(
	variant: Variant,
	isActive: boolean,
	onDark: boolean,
	blur: boolean
): string {
	return cn(
		VARIANT_STYLE[variant].base,
		FOCUS_RING,
		variant === 'full' && blur && 'backdrop-blur-2xl',
		stateClass(variant, isActive, onDark)
	);
}

function resolveIsActive(
	storedStatus: TargetStatus | undefined,
	status: WatchStatus,
	initialIsActive: boolean
): boolean {
	return storedStatus === undefined
		? initialIsActive
		: storedStatus === status;
}

function isHiddenUntilRelease(
	status: WatchStatus,
	isUnreleased: boolean,
	isActive: boolean
): boolean {
	return status === 'watched' && isUnreleased && !isActive;
}

function stateLabel(
	t: Translations,
	status: WatchStatus,
	isActive: boolean,
	hasError: boolean
): string {
	if (hasError) return t.common.actionError;
	const isWatched = status === 'watched';
	if (isActive) return isWatched ? t.movie.watched : t.movie.added;
	return isWatched ? t.movie.markAsWatched : t.movie.addToList;
}

/** Phone-width form of an idle label, or null when it is already short. */
function shortLabel(
	t: Translations,
	status: WatchStatus,
	isActive: boolean,
	hasError: boolean
): string | null {
	if (isActive || hasError) return null;
	const [full, short] =
		status === 'watched'
			? [t.movie.markAsWatched, t.movie.markAsWatchedShort]
			: [t.movie.addToList, t.movie.addToListShort];
	return short === full ? null : short;
}

function ButtonLabel({
	className,
	children,
}: {
	className?: string;
	children: string;
}) {
	return className ? <span className={className}>{children}</span> : children;
}

function idleIcon(status: WatchStatus, isActive: boolean) {
	if (isActive) return Check;
	return status === 'watched' ? Eye : Plus;
}

async function saveWatchStatus(media: MediaRef, target: TargetStatus) {
	if (target === 'none') {
		await removeFromWatchlist(media.mediaId, media.mediaType);
		return;
	}
	await addToWatchlist(
		media.mediaId,
		media.mediaTitle,
		media.posterPath,
		target,
		media.mediaType
	);
}

function syncShowStores(media: MediaRef, target: TargetStatus) {
	if (media.mediaType !== 'tv') return;
	if (target === 'none') episodeWatchStore.clearShow(media.mediaId);
	else promptStore.requestPush();
}

export function WatchButton({
	mediaId,
	mediaTitle,
	mediaType,
	posterPath,
	status,
	initialIsActive = false,
	variant = 'full',
	onDark = false,
	blur = true,
	fallbackStatus,
	releaseDate,
	compact = false,
}: WatchButtonProps) {
	const { loading, error, run } = useOptimisticAction();
	const [reviewOpen, setReviewOpen] = useState(false);
	const { t } = useTranslation();
	const router = useRouter();
	const storedStatus = useMediaWatch(mediaType, mediaId);

	const isActive = resolveIsActive(storedStatus, status, initialIsActive);
	const isUnreleased = useIsUnreleased(releaseDate);

	if (isHiddenUntilRelease(status, isUnreleased, isActive)) return null;

	const media: MediaRef = { mediaId, mediaTitle, mediaType, posterPath };

	async function handleClick(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const previous = mediaWatchStore.get(mediaType, mediaId);
		const target = isActive ? (fallbackStatus ?? 'none') : status;
		const effectivePrevious =
			previous?.status ?? (initialIsActive ? status : 'none');
		const changesMembership =
			target === 'none' || effectivePrevious === 'none';

		await run({
			apply: () => mediaWatchStore.set(mediaType, mediaId, target),
			rollback: () =>
				mediaWatchStore.restore(mediaType, mediaId, previous),
			action: async () => {
				await saveWatchStatus(media, target);
				return true;
			},
			onSuccess: () => {
				syncShowStores(media, target);
				if (changesMembership) router.refresh();
				if (target === 'watched') setReviewOpen(true);
			},
		});
	}

	const style = VARIANT_STYLE[variant];
	const label = stateLabel(t, status, isActive, error);
	const short = compact ? shortLabel(t, status, isActive, error) : null;

	return (
		<>
			<button
				onClick={handleClick}
				disabled={loading}
				aria-label={style.iconOnlyBelowLg || short ? label : undefined}
				className={buttonClassName(variant, isActive, onDark, blur)}
			>
				<ActionStatusIcon
					loading={loading}
					error={error}
					icon={idleIcon(status, isActive)}
					className={style.iconClass}
				/>
				{short ? (
					<>
						<span className="truncate sm:hidden">{short}</span>
						<span className="truncate max-sm:hidden">{label}</span>
					</>
				) : (
					<ButtonLabel className={style.labelClass}>
						{label}
					</ButtonLabel>
				)}
			</button>
			{reviewOpen && (
				<ReviewDialog
					open={reviewOpen}
					onClose={() => setReviewOpen(false)}
					mediaId={mediaId}
					mediaType={mediaType}
					mediaTitle={mediaTitle}
					posterPath={posterPath}
					onSave={(saved) => {
						mediaRatingStore.setMyReview(mediaType, mediaId, saved);
						mediaRatingStore.invalidateRating(mediaType, mediaId);
						router.refresh();
					}}
				/>
			)}
		</>
	);
}
