'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { MediaCard } from '@/components/media/card/MediaCard';
import { HorizontalScroll } from '@/components/shared/HorizontalScroll';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StaggeredItem } from '@/components/ui/StaggeredItem';
import { dismissRecommendation } from '@/app/actions/recommendations';
import { useTranslation } from '@/lib/i18n/context';
import { getMediaKey } from '@/lib/media';
import type { MediaItem, RecommendationSource } from '@/types/tmdb';
import { toastActionError } from '@/lib/action-toast';

const CARD_ANIMATION_DELAY_MS = 50;

interface ForYouSectionProps {
	title: string;
	items: MediaItem[];
}

function BecauseOf({ source }: { source: RecommendationSource }) {
	const { t } = useTranslation();
	const [before, after] =
		t.pages.dashboard.because[source.reason].split('${title}');

	return (
		<p className="px-1 text-xs leading-snug text-muted line-clamp-2">
			{before}
			<span className="font-medium text-text">{source.title}</span>
			{after}
		</p>
	);
}

/** "For you" recommendation row with per-card "not interested" dismissal and the reason behind each pick. */
export function ForYouSection({ title, items }: ForYouSectionProps) {
	const { t } = useTranslation();
	const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(
		() => new Set()
	);

	const visible = items.filter(
		(item) => !dismissedKeys.has(getMediaKey(item))
	);
	if (visible.length === 0) return null;

	async function handleDismiss(item: MediaItem) {
		const key = getMediaKey(item);
		setDismissedKeys((previous) => new Set(previous).add(key));
		try {
			await dismissRecommendation(
				item.id,
				item.media_type,
				item.genre_ids ?? []
			);
		} catch (err) {
			setDismissedKeys((previous) => {
				const next = new Set(previous);
				next.delete(key);
				return next;
			});
			toastActionError(err, t.common.actionError);
		}
	}

	return (
		<HorizontalScroll
			className="mb-12 lg:mb-16"
			scrollAmount={500}
			title={<SectionHeading>{title}</SectionHeading>}
		>
			{visible.map((item, index) => (
				<StaggeredItem
					key={getMediaKey(item)}
					index={index}
					staggerMs={CARD_ANIMATION_DELAY_MS}
					className="flex flex-none w-40 md:w-50 snap-start flex-col gap-2"
				>
					<MediaCard
						media={item}
						priority={index < 4}
						action={
							<button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleDismiss(item);
								}}
								aria-label={t.pages.dashboard.notInterested}
								title={t.pages.dashboard.notInterested}
								className="relative flex h-8 w-8 items-center justify-center rounded-full poster-chip-button text-text/70 shadow-card-sm cursor-pointer hover:text-white hover:bg-red/70 hover:border-red/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary before:absolute before:-inset-2 before:content-['']"
							>
								<X className="h-4 w-4" />
							</button>
						}
					/>
					{item.becauseOf && <BecauseOf source={item.becauseOf} />}
				</StaggeredItem>
			))}
		</HorizontalScroll>
	);
}
