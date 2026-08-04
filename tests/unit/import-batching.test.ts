import { describe, it, expect } from 'vitest';
import {
	chunkImportItems,
	countImportEntries,
} from '@/lib/data-transfer/batching';
import type { ImportItem, ImportedList } from '@/lib/data-transfer/types';

const item = (title: string, episodes = 0): ImportItem => ({
	title,
	year: null,
	status: 'to_watch',
	watchedEpisodes: episodes
		? Array.from({ length: episodes }, (_, i) => ({
				season: 1,
				episode: i + 1,
			}))
		: null,
});

const list = (name: string, size: number): ImportedList => ({
	name,
	description: null,
	items: Array.from({ length: size }, (_, i) => item(`${name}-${i}`)),
});

describe('countImportEntries', () => {
	it('adds loose items and every list item', () => {
		expect(countImportEntries([item('a'), item('b')], [list('l', 3)])).toBe(
			5
		);
	});

	it('returns zero on empty input', () => {
		expect(countImportEntries([], [])).toBe(0);
	});
});

describe('chunkImportItems', () => {
	it('caps a chunk at 20 titles', () => {
		const chunks = chunkImportItems(
			Array.from({ length: 45 }, (_, i) => item(`t${i}`))
		);
		expect(chunks.map((c) => c.length)).toEqual([20, 20, 5]);
	});

	it('splits before a chunk exceeds the episode budget', () => {
		const chunks = chunkImportItems([
			item('heavy', 1400),
			item('overflow', 200),
		]);
		expect(chunks).toHaveLength(2);
	});

	it('keeps a single over-budget title in its own chunk rather than dropping it', () => {
		const chunks = chunkImportItems([item('huge', 5000), item('next')]);
		expect(chunks[0].map((i) => i.title)).toEqual(['huge']);
		expect(chunks[1].map((i) => i.title)).toEqual(['next']);
	});

	it('returns no chunk for an empty import', () => {
		expect(chunkImportItems([])).toEqual([]);
	});
});
