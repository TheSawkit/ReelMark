import Fuse, { type IFuseOptions } from 'fuse.js';
import type { MediaItem } from '@/types/tmdb';
import { getMediaKey } from '@/lib/media';

const ACCENT_REGEX = /[̀-ͯ]/g;

function normalize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.normalize('NFD').replace(ACCENT_REGEX, '').toLowerCase().trim();
}

const FUSE_OPTIONS: IFuseOptions<MediaItem> = {
  keys: [
    { name: 'title', weight: 0.7, getFn: (item) => normalize(item.title) },
    {
      name: 'original_title',
      weight: 0.3,
      getFn: (item) => normalize(item.original_title),
    },
  ],
  threshold: 0.5,
  distance: 200,
  ignoreLocation: true,
  includeScore: false,
  shouldSort: true,
  minMatchCharLength: 3,
};

type Tier1Hit = { item: MediaItem; priority: number; popularity: number };

function tier1Exact(query: string, items: MediaItem[]): Tier1Hit[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  return items
    .map((item): Tier1Hit | null => {
      const normalizedTitle = normalize(item.title);
      const normalizedOriginal = normalize(item.original_title);
      let priority = 0;
      if (
        normalizedTitle === normalizedQuery ||
        normalizedOriginal === normalizedQuery
      )
        priority = 3;
      else if (
        normalizedTitle.startsWith(normalizedQuery) ||
        normalizedOriginal.startsWith(normalizedQuery)
      )
        priority = 2;
      else if (
        normalizedTitle.includes(normalizedQuery) ||
        normalizedOriginal.includes(normalizedQuery)
      )
        priority = 1;
      return priority > 0
        ? { item, priority, popularity: item.popularity ?? 0 }
        : null;
    })
    .filter((hit): hit is Tier1Hit => hit !== null)
    .sort((a, b) => b.priority - a.priority || b.popularity - a.popularity);
}

function tier2Fuzzy(query: string, items: MediaItem[]): MediaItem[] {
  if (items.length === 0) return [];
  const fuse = new Fuse(items, FUSE_OPTIONS);
  return fuse.search(normalize(query)).map((r) => r.item);
}

/**
 * Two-tier ranking for TMDB search suggestions:
 *   tier 1 — exact substring/prefix match, sorted by match precision then popularity
 *   tier 2 — Fuse.js fuzzy on the remaining items, for typo tolerance
 * Falls back to the raw input when both tiers yield nothing.
 */
export function rankMedia(query: string, items: MediaItem[]): MediaItem[] {
  if (items.length === 0 || !query.trim()) return items;

  const tier1 = tier1Exact(query, items);
  const tier1Keys = new Set(tier1.map((h) => getMediaKey(h.item)));
  const remaining = items.filter((i) => !tier1Keys.has(getMediaKey(i)));
  const tier2 = tier2Fuzzy(query, remaining);

  const combined = [...tier1.map((h) => h.item), ...tier2];
  return combined.length > 0 ? combined : items;
}
