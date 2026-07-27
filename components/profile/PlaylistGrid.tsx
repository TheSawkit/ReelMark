'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ListVideo, Loader2, X } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { getMediaKey } from '@/lib/media';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { cn } from '@/lib/utils';
import type { PlaylistItem } from '@/types/profile';

const CARD_BASE = cn(
	'group relative rounded-poster bg-surface border border-card-border block',
	'transition-[transform,border-color] duration-(--duration-medium) ease-apple will-change-transform',
	'hover:scale-[1.03] hover:border-gold/40 hover:shadow-poster hover:z-10'
);

const HOVER_OVERLAY = cn(
	'absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-transparent',
	'transition-opacity duration-(--duration-base) opacity-0 group-hover:opacity-100',
	'pointer-events-none'
);

const HOVER_TITLE = cn(
	'absolute inset-x-0 bottom-0 p-3 z-10',
	'translate-y-3 opacity-0 transition-all duration-(--duration-base)',
	'group-hover:translate-y-0 group-hover:opacity-100',
	'pointer-events-none'
);

interface PlaylistGridProps {
	items: PlaylistItem[];
	mode: 'edit' | 'view';
	pendingRemove: string | null;
	onRemove: (item: PlaylistItem) => void;
}

/** Poster grid of a playlist's items, with per-item removal in edit mode. */
export function PlaylistGrid({
	items,
	mode,
	pendingRemove,
	onRemove,
}: PlaylistGridProps) {
	const { t, lang } = useTranslation();

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-60 gap-4 px-8 text-center py-10">
				<div className="w-16 h-16 rounded-xl bg-surface-2 flex items-center justify-center">
					<ListVideo className="h-8 w-8 text-muted opacity-40" />
				</div>
				<div className="space-y-1">
					<p className="text-sm font-medium text-text">
						{t.profile.noPlaylists}
					</p>
					{mode === 'edit' && (
						<p className="text-xs text-muted">
							{t.profile.searchContent}
						</p>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
			{items.map((item) => {
				const key = getMediaKey({
					id: item.media_id,
					media_type: item.media_type,
				});
				const isRemoving = pendingRemove === key;
				return (
					<div key={item.id} className={CARD_BASE}>
						<Link
							href={localizedHref(
								lang,
								`/${item.media_type}/${item.media_id}`
							)}
							className="block relative aspect-2/3 w-full overflow-hidden rounded-poster"
						>
							{item.poster_path ? (
								<Image
									src={getImageUrl(item.poster_path, 'w342')}
									alt={item.media_title}
									fill
									sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 22vw"
									className="object-cover transition-transform duration-(--duration-base) ease-out group-hover:scale-105"
								/>
							) : (
								<div className="w-full h-full bg-surface-3 flex items-center justify-center">
									<ListVideo className="h-6 w-6 text-muted opacity-30" />
								</div>
							)}
							<div className={HOVER_OVERLAY} />
							<div className={HOVER_TITLE}>
								<p className="text-sm font-bold text-white leading-tight line-clamp-2">
									{item.media_title}
								</p>
							</div>
						</Link>

						{mode === 'edit' && (
							<button
								onClick={() => !isRemoving && onRemove(item)}
								disabled={isRemoving}
								aria-label={t.profile.removeFromPlaylistItem}
								className={cn(
									'absolute top-2 right-2 z-20',
									'w-6 h-6 rounded-full flex items-center justify-center',
									'glass-overlay-button shadow-card-sm text-text',
									'transition-all duration-(--duration-instant)',
									'sm:opacity-0 sm:scale-75 sm:group-hover:opacity-100 sm:group-hover:scale-100',
									isRemoving
										? 'opacity-100 scale-100'
										: 'cursor-pointer hover:bg-red/70 hover:border-red/50 hover:text-white'
								)}
							>
								{isRemoving ? (
									<Loader2 className="h-3 w-3 animate-spin text-muted" />
								) : (
									<X className="h-3 w-3" />
								)}
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
}
