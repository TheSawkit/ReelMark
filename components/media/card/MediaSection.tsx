'use client';

import Link from 'next/link';
import { MediaCard } from '@/components/media/card/MediaCard';
import { ArrowRight } from 'lucide-react';
import { HorizontalScroll } from '@/components/shared/HorizontalScroll';
import { useTranslation } from '@/lib/i18n/context';
import { watchlistEntryToMediaItem } from '@/lib/mappers';
import { getMediaKey } from '@/lib/media';
import type { MediaSectionProps } from '@/types/components';
import type { WatchlistEntry } from '@/types/tmdb';
import { StaggeredItem } from '@/components/ui/StaggeredItem';

interface LibrarySectionProps {
  title: string;
  entries: WatchlistEntry[];
  categoryUrl: string;
}

const CARD_ANIMATION_DELAY_MS = 50;

/**
 * Horizontal scrolling section for displaying media cards with category navigation.
 * Includes a linked section title and view-all card at the end.
 *
 * @param props - MediaSectionProps configuration
 * @param props.title - Section heading text
 * @param props.items - Array of media items to display
 * @param props.categoryUrl - URL for "View All" link
 * @param props.hideRating - If true, hides rating badges on cards
 * @returns Horizontal scroll container with animated media cards
 */
export function MediaSection({
  title,
  items,
  categoryUrl,
  hideRating,
}: MediaSectionProps) {
  const { t } = useTranslation();

  return (
    <HorizontalScroll
      className="mb-12 lg:mb-16"
      scrollAmount={500}
      title={<SectionTitle title={title} href={categoryUrl} />}
    >
      {items.map((media, index) => (
        <StaggeredItem
          key={getMediaKey(media)}
          index={index}
          staggerMs={CARD_ANIMATION_DELAY_MS}
          className="flex-none w-40 md:w-50 snap-start"
          eager={index < 4}
        >
          <MediaCard
            media={media}
            hideRating={hideRating}
            priority={index < 4}
            className="h-full"
          />
        </StaggeredItem>
      ))}
      <ViewAllCard href={categoryUrl} label={t.common.viewAll} />
    </HorizontalScroll>
  );
}

/**
 * Horizontal scrolling section for displaying watchlist entries with enhanced metadata.
 * Shows user's library items with watch status and dates instead of descriptions.
 *
 * @param props - LibrarySectionProps configuration
 * @param props.title - Section heading text
 * @param props.entries - Array of watchlist entries to display
 * @param props.categoryUrl - URL for "View All" link
 * @returns Horizontal scroll container with library media cards and metadata
 */
export function LibraryMediaSection({
  title,
  entries,
  categoryUrl,
}: LibrarySectionProps) {
  const { t } = useTranslation();
  const mediaItems = entries.map(watchlistEntryToMediaItem);

  return (
    <HorizontalScroll
      className="mb-12 lg:mb-16"
      scrollAmount={500}
      title={<SectionTitle title={title} href={categoryUrl} />}
    >
      {entries.map((entry, index) => (
        <StaggeredItem
          key={entry.id}
          index={index}
          staggerMs={CARD_ANIMATION_DELAY_MS}
          className="flex-none w-40 md:w-50 snap-start"
          eager={index < 4}
        >
          <MediaCard
            media={mediaItems[index]}
            watchlistEntry={entry}
            hideRating
            priority={index < 4}
            className="h-full"
          />
        </StaggeredItem>
      ))}
      <ViewAllCard href={categoryUrl} label={t.common.viewAll} />
    </HorizontalScroll>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="group/title flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-sm"
    >
      <h2 className="text-xl md:text-2xl font-bold group-hover/title:text-gold transition-colors duration-(--duration-medium) ease-apple tracking-tight">
        {title}
      </h2>
      <ArrowRight className="w-5 h-5 opacity-0 -translate-x-3 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all duration-(--duration-medium) ease-apple text-gold" />
    </Link>
  );
}

function ViewAllCard({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-none w-40 md:w-50 snap-start flex flex-col items-center justify-center gap-4 rounded-poster bg-surface hover:bg-surface-2 border-2 border-dashed border-border hover:border-primary/50 transition-all group/card cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <div className="rounded-full bg-surface-2 p-4 group-hover/card:bg-primary group-hover/card:text-white transition-colors">
        <ArrowRight className="w-6 h-6" />
      </div>
      <span className="font-semibold text-muted group-hover/card:text-text-main transition-colors">
        {label}
      </span>
    </Link>
  );
}
