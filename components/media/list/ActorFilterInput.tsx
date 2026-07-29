'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';
import { usePersonSuggestions } from '@/hooks/usePersonSuggestions';
import { getImageUrl } from '@/lib/tmdb/images';
import type { PersonSuggestion } from '@/types/tmdb';

interface ActorFilterInputProps {
	value: string;
	isFiltering: boolean;
	onQueryChange: (query: string) => void;
	onSelect: (person: PersonSuggestion) => void;
	onClear: () => void;
}

export function ActorFilterInput({
	value,
	isFiltering,
	onQueryChange,
	onSelect,
	onClear,
}: ActorFilterInputProps) {
	const { t } = useTranslation();
	const [suggestQuery, setSuggestQuery] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const { people, isLoading } = usePersonSuggestions(suggestQuery);
	const [trackedPeople, setTrackedPeople] = useState(people);
	const containerRef = useRef<HTMLDivElement>(null);

	const reactId = useId();
	const listboxId = `actor-listbox-${reactId}`;
	const optionId = (index: number) => `actor-option-${reactId}-${index}`;
	const expanded = isOpen && people.length > 0;

	if (trackedPeople !== people) {
		setTrackedPeople(people);
		setActiveIndex(-1);
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node))
				setIsOpen(false);
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const close = () => {
		setSuggestQuery('');
		setIsOpen(false);
		setActiveIndex(-1);
	};

	const handleChange = (query: string) => {
		onQueryChange(query);
		setSuggestQuery(query);
		setIsOpen(true);
	};

	const handleSelect = (person: PersonSuggestion) => {
		onSelect(person);
		close();
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape') {
			if (!isOpen) return;
			event.preventDefault();
			setIsOpen(false);
			setActiveIndex(-1);
			return;
		}

		if (people.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				setIsOpen(true);
				setActiveIndex((prev) => (prev + 1) % people.length);
				break;
			case 'ArrowUp':
				event.preventDefault();
				setIsOpen(true);
				setActiveIndex(
					(prev) => (prev - 1 + people.length) % people.length
				);
				break;
			case 'Home':
				if (isOpen) {
					event.preventDefault();
					setActiveIndex(0);
				}
				break;
			case 'End':
				if (isOpen) {
					event.preventDefault();
					setActiveIndex(people.length - 1);
				}
				break;
			case 'Enter':
				if (isOpen && activeIndex >= 0) {
					event.preventDefault();
					handleSelect(people[activeIndex]);
				}
				break;
		}
	};

	return (
		<div ref={containerRef} className="relative flex-1 min-w-44 max-w-64">
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
			<input
				type="text"
				value={value}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={() => {
					if (people.length > 0) setIsOpen(true);
				}}
				onKeyDown={handleKeyDown}
				placeholder={t.lists.actorPlaceholder}
				aria-label={t.lists.filterByActor}
				autoComplete="off"
				role="combobox"
				aria-expanded={expanded}
				aria-controls={listboxId}
				aria-autocomplete="list"
				aria-activedescendant={
					activeIndex >= 0 ? optionId(activeIndex) : undefined
				}
				className="w-full h-11 pl-9 pr-9 rounded-full bg-surface-2 border border-border text-sm text-text placeholder:text-muted outline-none transition-colors duration-(--duration-fast) focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
			/>
			{isFiltering || isLoading ? (
				<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted animate-spin" />
			) : (
				value !== '' && (
					<button
						type="button"
						onClick={() => {
							onClear();
							close();
						}}
						aria-label={t.lists.clearActor}
						className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted hover:text-text hover:bg-surface-3 transition-colors cursor-pointer"
					>
						<X className="h-4 w-4" />
					</button>
				)
			)}

			{expanded && (
				<ul
					id={listboxId}
					role="listbox"
					aria-label={t.lists.actorSuggestions}
					className="absolute top-full left-0 right-0 mt-2 p-1.5 list-none glass-popover rounded-(--radius-lg) shadow-card overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-(--duration-fast) ease-apple"
				>
					{people.map((person, index) => {
						const isActive = index === activeIndex;
						return (
							<li key={person.id} role="presentation">
								<button
									type="button"
									id={optionId(index)}
									role="option"
									aria-selected={isActive}
									onClick={() => handleSelect(person)}
									onMouseEnter={() => setActiveIndex(index)}
									className={cn(
										'flex w-full items-center gap-3 p-2 rounded-md text-left transition-colors duration-(--duration-fast) ease-apple cursor-pointer',
										isActive
											? 'bg-glass-bg-hover'
											: 'hover:bg-glass-bg-hover'
									)}
								>
									<span className="relative flex items-center justify-center w-9 h-9 shrink-0 rounded-full overflow-hidden bg-surface-3">
										{person.profile_path ? (
											<Image
												src={getImageUrl(
													person.profile_path,
													'w92'
												)}
												alt=""
												fill
												sizes="36px"
												className="object-cover"
											/>
										) : (
											<User className="w-4 h-4 text-muted" />
										)}
									</span>
									<span className="flex flex-col min-w-0">
										<span className="text-sm font-medium text-text truncate">
											{person.name}
										</span>
										{person.knownFor !== '' && (
											<span className="text-xs text-muted truncate">
												{person.knownFor}
											</span>
										)}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
