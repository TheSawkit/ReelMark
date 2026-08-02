'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, User } from 'lucide-react';
import type { MediaItem } from '@/types/tmdb';
import type { UserSearchResult } from '@/hooks/useSearchSuggestions';
import { getImageUrl } from '@/lib/tmdb/images';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { cn } from '@/lib/utils';
import { getMediaHref, getMediaKey } from '@/lib/media';
import { UserAvatar } from '@/components/shared/UserAvatar';

interface SearchDropdownProps {
	query: string;
	results: MediaItem[];
	users: UserSearchResult[];
	isUserSearch: boolean;
	isOpen: boolean;
	isLoading: boolean;
	activeIndex: number;
	listboxId: string;
	optionId: (index: number) => string;
	onClose: () => void;
	onActiveChange?: (index: number) => void;
}

export function SearchDropdown({
	query,
	results,
	users,
	isUserSearch,
	isOpen,
	isLoading,
	activeIndex,
	listboxId,
	optionId,
	onClose,
	onActiveChange,
}: SearchDropdownProps) {
	const { t, lang } = useTranslation();
	const isEmpty = isUserSearch ? users.length === 0 : results.length === 0;

	if (!isOpen) return null;

	if (query.length >= 2 && !isLoading && isEmpty) {
		return (
			<div
				className="absolute top-full mt-2 w-full glass-popover rounded-(--radius-xl) p-8 text-center shadow-card z-50 animate-in fade-in slide-in-from-top-2 duration-(--duration-fast) ease-apple"
				role="status"
				aria-live="polite"
			>
				<p className="text-muted text-base">
					{isUserSearch
						? `${t.pages.search.noUsersResults} "${query}"`
						: `${t.pages.search.noResults} "${query}"`}
				</p>
			</div>
		);
	}

	if (isEmpty) return null;

	if (isUserSearch) {
		return (
			<div className="absolute top-full mt-2 w-full glass-popover rounded-(--radius-xl) shadow-search-dropdown overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-(--duration-fast) ease-apple">
				<span className="sr-only" aria-live="polite">
					{users.length} {t.pages.search.usersFound}
				</span>
				<ul
					id={listboxId}
					role="listbox"
					aria-label={t.pages.search.usersLabel}
					className="p-2 list-none"
				>
					{users.map((user, index) => {
						const isActive = index === activeIndex;
						return (
							<li key={user.user_id} role="presentation">
								<Link
									id={optionId(index)}
									role="option"
									aria-selected={isActive}
									href={localizedHref(
										lang,
										`/profile/${user.username}`
									)}
									onClick={onClose}
									onMouseEnter={() => onActiveChange?.(index)}
									className={cn(
										'flex items-center gap-4 p-2 rounded-xl transition duration-(--duration-fast) ease-apple group active:bg-glass-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
										isActive
											? 'bg-glass-bg-hover ring-1 ring-primary/40'
											: 'hover:bg-glass-bg-hover'
									)}
								>
									<UserAvatar
										picture={user.avatar_url ?? undefined}
										fullName={user.username}
										size={40}
										className="w-10 h-10 shrink-0 rounded-full object-cover shadow-card-xs"
										loading="eager"
									/>
									<div className="flex flex-col min-w-0">
										<span
											className={cn(
												'font-semibold truncate transition-colors duration-(--duration-fast) ease-apple',
												isActive
													? 'text-red'
													: 'text-text group-hover:text-red'
											)}
										>
											@{user.username}
										</span>
										{user.bio && (
											<span className="text-sm text-muted truncate">
												{user.bio}
											</span>
										)}
									</div>
									<div
										className={cn(
											'ml-auto transition-opacity pr-2',
											isActive
												? 'opacity-100'
												: 'opacity-0 group-hover:opacity-100'
										)}
									>
										<span className="text-xs font-bold px-2 py-1 bg-red/10 text-red rounded-full border border-red/20">
											{t.common.view}
										</span>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
				<div className="bg-surface-2 px-4 py-3 border-t border-border flex items-center gap-2">
					<User className="w-3.5 h-3.5 text-muted" />
					<span className="text-xs text-muted">
						{t.pages.search.usersLabel}
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="absolute top-full mt-2 w-full glass-popover rounded-(--radius-xl) shadow-search-dropdown overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-(--duration-fast) ease-apple">
			<span className="sr-only" aria-live="polite">
				{t.pages.search.suggestionsCount.replace(
					'${count}',
					String(results.length)
				)}
			</span>
			<ul
				id={listboxId}
				role="listbox"
				aria-label={t.pages.search.suggestionsLabel}
				className="p-2 list-none"
			>
				{results.map((item, index) => {
					const isActive = index === activeIndex;
					return (
						<li key={getMediaKey(item)} role="presentation">
							<Link
								id={optionId(index)}
								role="option"
								aria-selected={isActive}
								href={localizedHref(lang, getMediaHref(item))}
								onClick={onClose}
								onMouseEnter={() => onActiveChange?.(index)}
								className={cn(
									'flex items-center gap-4 p-2 rounded-xl transition duration-(--duration-fast) ease-apple group relative overflow-hidden active:bg-glass-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
									isActive
										? 'bg-glass-bg-hover ring-1 ring-primary/40'
										: 'hover:bg-glass-bg-hover'
								)}
							>
								<div className="relative w-12 h-18 shrink-0 rounded-lg overflow-hidden shadow-card-xs">
									<Image
										src={getImageUrl(
											item.poster_path,
											'w92'
										)}
										alt={item.title}
										fill
										className={cn(
											'object-cover transition-transform duration-(--duration-slow)',
											isActive
												? 'scale-110'
												: 'group-hover:scale-110'
										)}
									/>
									<div
										className={cn(
											'absolute inset-0 bg-red/20 transition-opacity flex items-center justify-center',
											isActive
												? 'opacity-100'
												: 'opacity-0 group-hover:opacity-100'
										)}
									>
										<PlayCircle className="w-6 h-6 text-white drop-shadow-sm" />
									</div>
								</div>
								<div className="flex flex-col min-w-0">
									<span
										className={cn(
											'font-semibold truncate transition-colors duration-(--duration-fast) ease-apple',
											isActive
												? 'text-red'
												: 'text-text group-hover:text-red'
										)}
									>
										{item.title}
									</span>
									<span className="text-sm text-muted">
										{item.release_date
											? new Date(
													item.release_date
												).getFullYear()
											: t.movie.notRated}
									</span>
								</div>
								<div
									className={cn(
										'ml-auto transition-opacity pr-2',
										isActive
											? 'opacity-100'
											: 'opacity-0 group-hover:opacity-100'
									)}
								>
									<span className="text-xs font-bold px-2 py-1 bg-red/10 text-red rounded-full border border-red/20">
										{t.common.view}
									</span>
								</div>
							</Link>
						</li>
					);
				})}
			</ul>
			<div className="bg-surface-2 px-4 py-3 border-t border-border flex justify-between items-center">
				<span className="text-xs text-muted">
					{t.explorer.searchResults}
				</span>
				<Link
					href={localizedHref(
						lang,
						`/explorer/search?q=${encodeURIComponent(query)}`
					)}
					className="text-xs font-bold text-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded"
					onClick={onClose}
				>
					{t.common.viewAll}
				</Link>
			</div>
		</div>
	);
}
