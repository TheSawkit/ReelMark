'use client';

import Image from 'next/image';
import { Check, Loader2 } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb/images';
import { getMediaKey } from '@/lib/media';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/tmdb';

interface PlaylistSearchResultsProps {
	results: MediaItem[];
	query: string;
	isLoading: boolean;
	inPlaylist: Set<string>;
	pendingAdd: string | null;
	onAdd: (item: MediaItem) => void;
}

/** Search suggestions list used to add items to a playlist. */
export function PlaylistSearchResults({
	results,
	query,
	isLoading,
	inPlaylist,
	pendingAdd,
	onAdd,
}: PlaylistSearchResultsProps) {
	const { t } = useTranslation();

	if (results.length === 0) {
		if (isLoading)
			return (
				<div className="flex items-center justify-center min-h-32 py-6">
					<Loader2 className="h-5 w-5 animate-spin text-muted" />
				</div>
			);
		return (
			<div className="flex flex-col items-center justify-center min-h-32 gap-1.5 text-center px-6 py-6">
				<p className="text-sm font-medium text-text">
					{t.profile.noSearchResults}
				</p>
				{query.trim() && (
					<p className="text-xs text-muted">« {query.trim()} »</p>
				)}
			</div>
		);
	}

	return (
		<ul className="p-2 list-none">
			{results.map((item) => {
				const key = getMediaKey(item);
				const added = inPlaylist.has(key);
				const pending = pendingAdd === key;
				return (
					<li key={key} role="presentation">
						<button
							type="button"
							disabled={added || pending}
							onClick={() => onAdd(item)}
							className={cn(
								'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl',
								'transition-colors duration-(--duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
								added
									? 'opacity-60 cursor-default'
									: 'hover:bg-surface-2 cursor-pointer'
							)}
						>
							<div className="relative w-9 h-14 shrink-0 rounded-poster overflow-hidden bg-surface-3">
								{item.poster_path && (
									<Image
										src={getImageUrl(
											item.poster_path,
											'w92'
										)}
										alt={item.title}
										fill
										className="object-cover"
									/>
								)}
							</div>
							<div className="flex flex-col min-w-0 flex-1 text-left">
								<span className="text-sm font-semibold text-text truncate">
									{item.title}
								</span>
								<span className="text-xs text-muted">
									{item.release_date
										? new Date(
												item.release_date
											).getFullYear()
										: '—'}
								</span>
							</div>
							<div className="shrink-0 w-5 flex items-center justify-center">
								{pending ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
								) : added ? (
									<Check className="h-3.5 w-3.5 text-primary" />
								) : null}
							</div>
						</button>
					</li>
				);
			})}
		</ul>
	);
}
