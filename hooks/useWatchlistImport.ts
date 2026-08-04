'use client';

import { useCallback, useRef, useState } from 'react';
import { importBatch, importLists } from '@/app/actions/data';
import { createInFlightGuard } from '@/lib/in-flight-guard';
import {
	chunkImportItems,
	countImportEntries,
} from '@/lib/data-transfer/batching';
import type { ImportItem, ImportedList } from '@/lib/data-transfer/types';

export type ImportPhase =
	| { type: 'idle' }
	| { type: 'ready'; items: ImportItem[]; lists: ImportedList[] }
	| { type: 'importing'; total: number; done: number }
	| { type: 'done'; imported: number; failed: string[] };

/**
 * Drives a parsed watchlist through the import actions batch by batch, exposing the phase
 * the UI renders. A failed batch counts as failed titles, never as an aborted import.
 */
export function useWatchlistImport() {
	const [phase, setPhase] = useState<ImportPhase>({ type: 'idle' });
	const guardRef = useRef<ReturnType<typeof createInFlightGuard>>(null);
	guardRef.current ??= createInFlightGuard();

	const advance = useCallback(
		(count: number) =>
			setPhase((prev) =>
				prev.type === 'importing'
					? { ...prev, done: Math.min(prev.done + count, prev.total) }
					: prev
			),
		[]
	);

	const start = useCallback(
		async (items: ImportItem[], lists: ImportedList[]) => {
			const guard = guardRef.current;
			if (!guard || guard.busy) return;

			await guard.run(async () => {
				setPhase({
					type: 'importing',
					total: countImportEntries(items, lists),
					done: 0,
				});

				let imported = 0;
				const failed: string[] = [];

				for (const chunk of chunkImportItems(items)) {
					try {
						const result = await importBatch(chunk);
						imported += result.imported;
						failed.push(...result.failed);
					} catch {
						failed.push(...chunk.map((item) => item.title));
					}
					advance(chunk.length);
				}

				for (const list of lists) {
					try {
						const result = await importLists([list]);
						imported += result.imported;
						failed.push(...result.failed);
					} catch {
						failed.push(...list.items.map((item) => item.title));
					}
					advance(list.items.length);
				}

				setPhase({ type: 'done', imported, failed });
			});
		},
		[advance]
	);

	const setReady = useCallback(
		(items: ImportItem[], lists: ImportedList[]) =>
			setPhase({ type: 'ready', items, lists }),
		[]
	);

	const reset = useCallback(() => setPhase({ type: 'idle' }), []);

	return { phase, setReady, start, reset };
}
