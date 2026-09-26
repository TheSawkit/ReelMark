'use client';

import { useMemo, type ReactNode } from 'react';
import { WindowVirtualizer } from 'virtua';
import { getMediaKey } from '@/lib/media';
import { useGridColumns, type GridColumns } from '@/hooks/useGridColumns';
import type { MediaItem } from '@/types/tmdb';

const SSR_ROWS = 4;

interface VirtualMediaGridProps {
	items: MediaItem[];
	columns: GridColumns;
	rowClassName: string;
	renderItem: (item: MediaItem, index: number) => ReactNode;
}

/** Window-scrolled virtualized grid: only visible rows stay in the DOM, keeping memory flat on very long lists. */
export function VirtualMediaGrid({
	items,
	columns,
	rowClassName,
	renderItem,
}: VirtualMediaGridProps) {
	const cols = useGridColumns(columns);

	const rows = useMemo(() => {
		const chunked: MediaItem[][] = [];
		for (let i = 0; i < items.length; i += cols) {
			chunked.push(items.slice(i, i + cols));
		}
		return chunked;
	}, [items, cols]);

	if (rows.length === 0) return null;

	return (
		// Keyed on the column count: it resolves only after mount, which reshapes `rows`
		// under the virtualizer and would leave it indexing rows that no longer exist.
		<WindowVirtualizer
			key={cols}
			ssrCount={Math.min(SSR_ROWS, rows.length)}
		>
			{rows.map((row, rowIndex) => (
				<div key={getMediaKey(row[0])} className={rowClassName}>
					{row.map((item, colIndex) =>
						renderItem(item, rowIndex * cols + colIndex)
					)}
				</div>
			))}
		</WindowVirtualizer>
	);
}
