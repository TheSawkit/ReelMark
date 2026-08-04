import type { ImportItem, ImportedList } from './types';

const BATCH_SIZE = 20;
const EPISODES_PER_BATCH = 1500;

/** @returns Total titles to import across loose items and lists — the denominator of the progress bar. */
export function countImportEntries(
	items: ImportItem[],
	lists: ImportedList[]
): number {
	return (
		items.length + lists.reduce((sum, list) => sum + list.items.length, 0)
	);
}

/**
 * Splits items into server-action payloads bounded by title count *and* episode volume,
 * so a handful of long-running shows cannot blow up a single request.
 */
export function chunkImportItems(items: ImportItem[]): ImportItem[][] {
	const chunks: ImportItem[][] = [];
	let current: ImportItem[] = [];
	let currentEpisodes = 0;

	for (const item of items) {
		const episodeCount = item.watchedEpisodes?.length ?? 0;
		const overflows =
			current.length >= BATCH_SIZE ||
			(current.length > 0 &&
				currentEpisodes + episodeCount > EPISODES_PER_BATCH);
		if (overflows) {
			chunks.push(current);
			current = [];
			currentEpisodes = 0;
		}
		current.push(item);
		currentEpisodes += episodeCount;
	}

	if (current.length > 0) chunks.push(current);
	return chunks;
}
