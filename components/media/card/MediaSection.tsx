'use client';

import Link from 'next/link';
import { MediaCard } from '@/components/media/card/MediaCard';
import { ArrowRight } from 'lucide-react';
import { HorizontalScroll } from '@/components/shared/HorizontalScroll';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useTranslation } from '@/lib/i18n/context';
import { localizedHref } from '@/lib/i18n/utils';
import { watchlistEntryToMediaItem } from '@/lib/mappers';
import { getMediaKey } from '@/lib/media';
import type { MediaSectionProps } from '@/types/components';
import type { WatchlistEntry } from '@/types/tmdb';
import { StaggeredItem } from '@/components/ui/StaggeredItem';

interface LibrarySectionProps {
	title: string;
	entries: WatchlistEntry[];
	categoryUrl: string;
	tvProgress?: Record<number, { watched: number; total: number }>;
}

const CARD_ANIMATION_DELAY_MS = 50;
const SECTION_ITEM_LIMIT = 10;

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
	const { t, lang } = useTranslation();
	const visible = items.slice(0, SECTION_ITEM_LIMIT);
	const localizedCategoryUrl = categoryUrl
		? localizedHref(lang, categoryUrl)
		: undefined;

	return (
		<HorizontalScroll
			className="mb-12 lg:mb-16"
			scrollAmount={500}
			title={
				<SectionHeading href={localizedCategoryUrl}>
					{title}
				</SectionHeading>
			}
		>
			{visible.map((media, index) => (
				<StaggeredItem
					key={getMediaKey(media)}
					index={index}
					staggerMs={CARD_ANIMATION_DELAY_MS}
					className="flex-none w-40 md:w-50 snap-start"
				>
					<MediaCard
						media={media}
						hideRating={hideRating}
						priority={index < 4}
						className="h-full"
					/>
				</StaggeredItem>
			))}
			{localizedCategoryUrl && (
				<ViewAllCard
					href={localizedCategoryUrl}
					label={t.common.viewAll}
				/>
			)}
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
	tvProgress,
}: LibrarySectionProps) {
	const { t, lang } = useTranslation();
	const visibleEntries = entries.slice(0, SECTION_ITEM_LIMIT);
	const mediaItems = visibleEntries.map(watchlistEntryToMediaItem);
	const localizedCategoryUrl = localizedHref(lang, categoryUrl);

	return (
		<HorizontalScroll
			className="mb-12 lg:mb-16"
			scrollAmount={500}
			title={
				<SectionHeading href={localizedCategoryUrl}>
					{title}
				</SectionHeading>
			}
		>
			{visibleEntries.map((entry, index) => (
				<StaggeredItem
					key={entry.id}
					index={index}
					staggerMs={CARD_ANIMATION_DELAY_MS}
					className="flex-none w-40 md:w-50 snap-start"
				>
					<MediaCard
						media={mediaItems[index]}
						watchlistEntry={entry}
						tvProgress={tvProgress?.[entry.media_id]}
						hideRating
						priority={index < 4}
						className="h-full"
					/>
				</StaggeredItem>
			))}
			<ViewAllCard href={localizedCategoryUrl} label={t.common.viewAll} />
		</HorizontalScroll>
	);
}

function ViewAllCard({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			className="flex-none w-40 md:w-50 snap-start flex flex-col items-center justify-center gap-4 rounded-poster bg-surface hover:bg-surface-2 border-2 border-dashed border-border hover:border-primary/50 transition group/card cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
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
