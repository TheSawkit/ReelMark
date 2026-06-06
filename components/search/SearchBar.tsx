'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { Search, User, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/context';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { SearchDropdown } from './SearchDropdown';
import { cn } from '@/lib/utils';
import { getMediaHref } from '@/lib/media';

interface SearchBarProps {
	variant?: 'normal' | 'compact';
	onClose?: () => void;
	onNavigate?: () => void;
	autoFocus?: boolean;
}

export function SearchBar({
	variant = 'normal',
	onClose,
	onNavigate,
	autoFocus = false,
}: SearchBarProps) {
	const { t } = useTranslation();
	const [query, setQuery] = useState('');
	const [isFocused, setIsFocused] = useState(autoFocus);
	const [activeIndex, setActiveIndex] = useState(-1);
	const { results, users, isLoading, isOpen, setIsOpen } =
		useSearchSuggestions(query);
	const isUserSearch = query.startsWith('@');
	const activeItems = isUserSearch ? users : results;
	const [trackedResults, setTrackedResults] = useState(results);
	const [trackedUsers, setTrackedUsers] = useState(users);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const isCompact = variant === 'compact';

	const reactId = useId();
	const inputId = `search-input-${reactId}`;
	const listboxId = `search-listbox-${reactId}`;
	const optionId = (index: number) => `search-option-${reactId}-${index}`;
	const expanded = isOpen && activeItems.length > 0;

	if (trackedResults !== results || trackedUsers !== users) {
		setTrackedResults(results);
		setTrackedUsers(users);
		setActiveIndex(-1);
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				onClose?.();
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, [setIsOpen, onClose]);

	const handleSelect = () => {
		setIsOpen(false);
		setActiveIndex(-1);
		onClose?.();
		onNavigate?.();
	};

	const handleSearch = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (query.trim().length < 2) return;
		if (isUserSearch) return;
		handleSelect();
		router.push(`/explorer/search?q=${encodeURIComponent(query.trim())}`);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!activeItems.length && e.key !== 'Escape') return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (!isOpen) setIsOpen(true);
				setActiveIndex((prev) => (prev + 1) % activeItems.length);
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (!isOpen) setIsOpen(true);
				setActiveIndex(
					(prev) =>
						(prev - 1 + activeItems.length) % activeItems.length
				);
				break;
			case 'Home':
				if (isOpen && activeItems.length > 0) {
					e.preventDefault();
					setActiveIndex(0);
				}
				break;
			case 'End':
				if (isOpen && activeItems.length > 0) {
					e.preventDefault();
					setActiveIndex(activeItems.length - 1);
				}
				break;
			case 'Enter':
				if (activeIndex >= 0 && activeIndex < activeItems.length) {
					e.preventDefault();
					handleSelect();
					if (isUserSearch) {
						router.push(`/profile/${users[activeIndex].username}`);
					} else {
						router.push(getMediaHref(results[activeIndex]));
					}
				}
				break;
			case 'Escape':
				if (isOpen) {
					e.preventDefault();
					setIsOpen(false);
					setActiveIndex(-1);
				}
				break;
		}
	};

	const SearchIcon = isUserSearch ? User : Search;

	return (
		<div
			className={cn(
				'relative w-full',
				!isCompact && 'max-w-3xl mx-auto mb-8 md:mb-12'
			)}
			ref={dropdownRef}
		>
			<form
				onSubmit={handleSearch}
				className="relative group flex items-center"
				role="search"
			>
				<label htmlFor={inputId} className="sr-only">
					{t.pages.search.placeholder}
				</label>
				<Input
					id={inputId}
					type="text"
					placeholder=""
					autoComplete="off"
					role="combobox"
					aria-expanded={expanded}
					aria-controls={listboxId}
					aria-autocomplete="list"
					aria-activedescendant={
						activeIndex >= 0 ? optionId(activeIndex) : undefined
					}
					className={cn(
						'transition-all duration-(--duration-base) ease-apple',
						isCompact
							? 'pl-10 pr-8 py-2 h-10 bg-surface-2/50 backdrop-blur border border-border/30 hover:border-border/50 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background text-sm shadow-sm rounded-lg'
							: 'pl-16 pr-10 py-3 h-16 glass-surface hover:border-glass-border-hover focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background text-base shadow-card rounded-(--radius-xl)'
					)}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => {
						setIsFocused(true);
						if (query.length >= 2) setIsOpen(true);
					}}
					onBlur={() => setIsFocused(false)}
					onKeyDown={handleKeyDown}
					autoFocus={autoFocus}
				/>

				{!query && (
					<div
						className={cn(
							'absolute inset-y-0 flex items-center pointer-events-none',
							isCompact ? 'left-10' : 'left-16'
						)}
						aria-hidden
					>
						<div className="relative">
							<span
								className={cn(
									'block transition-all duration-(--duration-base) ease-apple text-muted/50 whitespace-nowrap',
									isCompact ? 'text-sm' : 'text-base',
									isFocused
										? 'opacity-0 -translate-y-2'
										: 'opacity-100 translate-y-0'
								)}
							>
								{t.pages.search.placeholder}
							</span>
							<span
								className={cn(
									'absolute inset-0 transition-all duration-(--duration-base) ease-apple text-muted/50 whitespace-nowrap',
									isCompact ? 'text-sm' : 'text-base',
									isFocused
										? 'opacity-100 translate-y-0'
										: 'opacity-0 translate-y-2'
								)}
							>
								{t.pages.search.hint}
							</span>
						</div>
					</div>
				)}

				<div
					className={cn(
						'absolute left-0 inset-y-0 flex items-center pointer-events-none transition-all duration-(--duration-fast) ease-apple',
						isCompact
							? 'pl-3 group-focus-within:text-primary'
							: 'pl-5 group-focus-within:text-red'
					)}
				>
					{isLoading ? (
						<Loader2
							className={cn(
								'animate-spin text-muted',
								isCompact ? 'w-4 h-4' : 'w-6 h-6'
							)}
						/>
					) : isCompact ? (
						<SearchIcon className="w-4 h-4 text-muted transition-all duration-(--duration-fast) ease-apple group-focus-within:scale-110" />
					) : (
						<div className="flex items-center gap-3">
							<SearchIcon className="w-6 h-6 text-muted transition-all duration-(--duration-fast) ease-apple group-focus-within:scale-110" />
							<div className="w-px h-7 bg-border/30" />
						</div>
					)}
				</div>

				{query && (
					<button
						type="button"
						onClick={() => setQuery('')}
						aria-label={t.common.clearSearch}
						className={cn(
							'absolute inset-y-0 flex items-center text-muted hover:text-text transition-all duration-(--duration-fast) ease-apple',
							isCompact ? 'right-2' : 'right-3 hover:scale-110'
						)}
					>
						<X className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
					</button>
				)}
			</form>

			<SearchDropdown
				query={query}
				results={results}
				users={users}
				isUserSearch={isUserSearch}
				isOpen={isOpen}
				isLoading={isLoading}
				activeIndex={activeIndex}
				listboxId={listboxId}
				optionId={optionId}
				onClose={handleSelect}
				onActiveChange={setActiveIndex}
			/>
		</div>
	);
}
