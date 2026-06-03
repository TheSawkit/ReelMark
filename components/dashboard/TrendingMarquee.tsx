import { SectionHeading } from '@/components/ui/SectionHeading';
import { MovingRow } from '@/components/effects/MovingRow';
import { MediaCard } from '@/components/media/card/MediaCard';
import { getMediaKey } from '@/lib/media';
import type { MediaItem } from '@/types/tmdb';

interface TrendingMarqueeProps {
	title: string;
	items: MediaItem[];
}

/** Auto-scrolling marquee of trending posters (pauses on hover). */
export function TrendingMarquee({ title, items }: TrendingMarqueeProps) {
	if (items.length === 0) return null;

	return (
		<section className="mb-12">
			<div className="mb-4">
				<SectionHeading>{title}</SectionHeading>
			</div>
			<MovingRow speed={55} gap={14}>
				{items.map((m) => (
					<div key={getMediaKey(m)} className="w-28 sm:w-32">
						<MediaCard media={m} hideRating compact />
					</div>
				))}
			</MovingRow>
		</section>
	);
}
