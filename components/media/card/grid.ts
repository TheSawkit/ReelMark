import type { GridColumns } from '@/hooks/useGridColumns';

/**
 * The two poster grids, one source for the rendered grids, their virtualized rows and their
 * skeletons: `columns` drives virtualization, the classes drive markup (row padding = row gap).
 */
export const MEDIA_GRID = {
	columns: { base: 2, md: 3, lg: 4, xl: 6 } satisfies GridColumns,
	className:
		'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8',
	rowClassName:
		'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8 pb-4 md:pb-6 lg:pb-8',
} as const;

export const LIBRARY_GRID = {
	columns: { base: 2, sm: 3, md: 4, lg: 5, xl: 6 } satisfies GridColumns,
	className:
		'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6',
	rowClassName:
		'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 pb-3 sm:pb-4 md:pb-6',
} as const;
