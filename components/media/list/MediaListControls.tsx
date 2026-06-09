'use client';

import {
	ArrowDownNarrowWide,
	ArrowUpNarrowWide,
	ChevronDown,
	ListFilter,
	Loader2,
	Search,
	X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuCheckboxItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SORT_KEYS, type SortKey } from '@/lib/media-list/controls';
import type { UseMediaListControls } from '@/hooks/useMediaListControls';

interface MediaListControlsProps {
	controls: UseMediaListControls;
	sortKeys?: readonly SortKey[];
	className?: string;
}

const triggerClass =
	'flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-2 border border-border text-sm font-medium text-text hover:bg-surface-3 transition-colors duration-(--duration-fast) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-10';

export function MediaListControls({
	controls,
	sortKeys = SORT_KEYS,
	className,
}: MediaListControlsProps) {
	const { t } = useTranslation();
	const {
		state,
		genres,
		isActorLoading,
		setSort,
		toggleDir,
		toggleGenre,
		setActorQuery,
		clearActor,
		clearAll,
		hasActiveFilters,
	} = controls;

	const sortLabels: Record<SortKey, string> = {
		added: t.lists.sortAdded,
		year: t.lists.sortYear,
		title: t.lists.sortTitle,
		rating: t.lists.sortRating,
	};

	const activeGenres = genres.filter((g) => state.genreIds.includes(g.id));
	const isDesc = state.sortDir === 'desc';

	return (
		<div className={cn('flex flex-col gap-3', className)}>
			<div className="flex flex-wrap items-center gap-2">
				<DropdownMenu>
					<DropdownMenuTrigger className={triggerClass}>
						<ListFilter className="h-4 w-4 text-muted" />
						<span className="text-muted">{t.lists.sortBy}</span>
						<span>{sortLabels[state.sortKey]}</span>
						<ChevronDown className="h-4 w-4 text-muted" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="min-w-44">
						<DropdownMenuRadioGroup
							value={state.sortKey}
							onValueChange={(value) => setSort(value as SortKey)}
						>
							{sortKeys.map((key) => (
								<DropdownMenuRadioItem key={key} value={key}>
									{sortLabels[key]}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<button
					type="button"
					onClick={toggleDir}
					className={cn(triggerClass, 'px-3')}
					aria-label={isDesc ? t.lists.descending : t.lists.ascending}
					title={isDesc ? t.lists.descending : t.lists.ascending}
				>
					{isDesc ? (
						<ArrowDownNarrowWide className="h-4 w-4" />
					) : (
						<ArrowUpNarrowWide className="h-4 w-4" />
					)}
				</button>

				{genres.length > 0 && (
					<DropdownMenu>
						<DropdownMenuTrigger
							className={cn(
								triggerClass,
								state.genreIds.length > 0 &&
									'border-primary/50 text-text'
							)}
						>
							<span>{t.lists.genres}</span>
							{state.genreIds.length > 0 && (
								<span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/20 text-xs">
									{state.genreIds.length}
								</span>
							)}
							<ChevronDown className="h-4 w-4 text-muted" />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="min-w-52 max-h-80"
						>
							<DropdownMenuLabel className="text-muted">
								{t.lists.filterByGenre}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{genres.map((genre) => (
								<DropdownMenuCheckboxItem
									key={genre.id}
									checked={state.genreIds.includes(genre.id)}
									onCheckedChange={() =>
										toggleGenre(genre.id)
									}
									onSelect={(e) => e.preventDefault()}
								>
									{genre.name}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}

				<div className="relative flex-1 min-w-44 max-w-64">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
					<input
						type="text"
						value={state.actorQuery}
						onChange={(e) => setActorQuery(e.target.value)}
						placeholder={t.lists.actorPlaceholder}
						aria-label={t.lists.filterByActor}
						className="w-full h-10 pl-9 pr-9 rounded-full bg-surface-2 border border-border text-sm text-text placeholder:text-muted outline-none transition-colors duration-(--duration-fast) focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
					/>
					{isActorLoading ? (
						<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted animate-spin" />
					) : (
						state.actorQuery !== '' && (
							<button
								type="button"
								onClick={clearActor}
								aria-label={t.lists.clearActor}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted hover:text-text hover:bg-surface-3 transition-colors cursor-pointer"
							>
								<X className="h-4 w-4" />
							</button>
						)
					)}
				</div>
			</div>

			{hasActiveFilters && (
				<div
					className="flex flex-wrap items-center gap-2"
					aria-label={t.lists.activeFilters}
				>
					{activeGenres.map((genre) => (
						<FilterChip
							key={genre.id}
							label={genre.name}
							onRemove={() => toggleGenre(genre.id)}
							removeLabel={t.lists.removeFilter}
						/>
					))}
					{state.actorQuery.trim() !== '' && (
						<FilterChip
							label={`${t.lists.actor}: ${state.actorQuery.trim()}`}
							onRemove={clearActor}
							removeLabel={t.lists.removeFilter}
						/>
					)}
					<button
						type="button"
						onClick={clearAll}
						className="text-xs font-medium text-muted hover:text-text transition-colors cursor-pointer px-2 py-1"
					>
						{t.lists.clearFilters}
					</button>
				</div>
			)}
		</div>
	);
}

function FilterChip({
	label,
	onRemove,
	removeLabel,
}: {
	label: string;
	onRemove: () => void;
	removeLabel: string;
}) {
	return (
		<span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-medium text-text">
			{label}
			<button
				type="button"
				onClick={onRemove}
				aria-label={`${removeLabel} ${label}`}
				className="p-0.5 rounded-full text-muted hover:text-text hover:bg-primary/20 transition-colors cursor-pointer"
			>
				<X className="h-3.5 w-3.5" />
			</button>
		</span>
	);
}
