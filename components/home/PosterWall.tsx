import Image from 'next/image';
import { MovingRow } from '@/components/effects/MovingRow';
import { getImageUrl } from '@/lib/tmdb';
import { getMediaKey } from '@/lib/media';
import type { MediaItem } from '@/types/tmdb';

function Poster({ item }: { item: MediaItem }) {
	if (!item.poster_path) return null;
	return (
		<div className="relative aspect-2/3 w-24 shrink-0 overflow-hidden rounded-poster border border-border-subtle/40 shadow-poster sm:w-28 md:w-32">
			<Image
				src={getImageUrl(item.poster_path, 'w342')}
				alt=""
				fill
				sizes="128px"
				className="object-cover"
			/>
		</div>
	);
}

/** Decorative dual-marquee wall of trending posters used as the landing hero backdrop. */
export function PosterWall({ items }: { items: MediaItem[] }) {
	const withPoster = items.filter((m) => m.poster_path);
	if (withPoster.length === 0) return null;

	const half = Math.ceil(withPoster.length / 2);
	const rowA = withPoster.slice(0, half);
	const rowB = withPoster.slice(half);

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 opacity-40 [mask-image:radial-gradient(ellipse_at_center,transparent_8%,#000_70%)]"
		>
			<MovingRow speed={75} gap={16}>
				{rowA.map((m) => (
					<Poster key={getMediaKey(m)} item={m} />
				))}
			</MovingRow>
			<MovingRow speed={95} gap={16} reverse>
				{rowB.map((m) => (
					<Poster key={getMediaKey(m)} item={m} />
				))}
			</MovingRow>
		</div>
	);
}
